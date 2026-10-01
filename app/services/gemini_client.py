"""
Usage:
    result = await generate_structured(
        system_instruction="You are ...",
        prompt="Here is the menu ...",
        response_model=MyPydanticModel,
    )

Any failure is raised as AIServiceError, which the error handlers turn into {"message": ...}.
"""
import logging
from typing import Generic, NamedTuple, TypeVar

import httpx
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.core.errors import AIServiceError

logger = logging.getLogger(__name__)

ResponseModel = TypeVar("ResponseModel", bound=BaseModel)

# HTTP status codes 
RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

# If main model still fails after retries, try fallback model
FALLBACK_STATUS_CODES = {429, 503}

# Created on first use, reused again in every request
_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            logger.error("GEMINI_API_KEY is not set")
            raise AIServiceError("The AI service is not configured. Please contact the team.")

        _client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=types.HttpOptions(
                timeout=settings.gemini_timeout_seconds * 1000,
  
                retry_options=types.HttpRetryOptions(
                    attempts=settings.gemini_max_attempts,
                    initial_delay=1.0,
                    max_delay=8.0,
                    http_status_codes=RETRYABLE_STATUS_CODES,
                ),
            ),
        )
    return _client


class AIResult(NamedTuple, Generic[ResponseModel]):
    data: ResponseModel  
    model: str           # which Gemini model answered (main or fallback)


async def generate_structured(
    *,
    system_instruction: str,
    prompt: str,
    response_model: type[ResponseModel],
    temperature: float = 0.4,
) -> AIResult[ResponseModel]:
    """Send a prompt to Gemini and return its answer parsed into `response_model`.

    Gemini is told to answer in JSON matching the model's schema. If the answer still
    doesn't fit the schema, we ask once more before giving up.
    If the main model is overloaded (503) or rate-limited (429), the fallback model is tried once.
    """
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=response_model,
        temperature=temperature,  

        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    for attempt in (1, 2):
        try:
            response, model = await _generate_with_fallback(prompt, config)
        except errors.ClientError as exc:

            logger.error("Gemini rejected the request (%s): %s", exc.code, exc.message)
            if exc.code == 429:
                raise AIServiceError("The AI service is busy right now. Please try again in a minute.")
            raise AIServiceError("The AI service could not process this request.", status_code=502)
        except errors.ServerError as exc:

            logger.error("Gemini server error (%s): %s", exc.code, exc.message)
            raise AIServiceError("The AI service is temporarily unavailable. Please try again.")
        except httpx.TimeoutException:
            logger.error("Gemini did not answer within %ss", settings.gemini_timeout_seconds)
            raise AIServiceError("The AI service took too long to answer. Please try again.", status_code=504)
        except httpx.HTTPError as exc:
            logger.error("Could not reach Gemini: %s", exc)
            raise AIServiceError("Could not reach the AI service. Please try again.")

        parsed = _parse(response, response_model)
        if parsed is not None:
            return AIResult(parsed, model)
        logger.warning("Gemini answer did not match %s (attempt %s)", response_model.__name__, attempt)

    raise AIServiceError("The AI returned an unexpected answer. Please try again.", status_code=502)


async def _generate_with_fallback(
    prompt: str, config: types.GenerateContentConfig
) -> tuple[types.GenerateContentResponse, str]:
    """Call the main model; if it is overloaded or rate-limited, call the fallback model once."""
    main, fallback = settings.gemini_model, settings.gemini_fallback_model
    try:
        return await _generate(main, prompt, config), main
    except errors.APIError as exc:
        if exc.code not in FALLBACK_STATUS_CODES or not fallback or fallback == main:
            raise
        logger.warning("%s unavailable (%s); trying fallback model %s", main, exc.code, fallback)
        return await _generate(fallback, prompt, config), fallback


async def _generate(model: str, prompt: str, config: types.GenerateContentConfig) -> types.GenerateContentResponse:
    return await get_client().aio.models.generate_content(model=model, contents=prompt, config=config)


def _parse(response: types.GenerateContentResponse, response_model: type[ResponseModel]) -> ResponseModel | None:

    if isinstance(response.parsed, response_model):
        return response.parsed

    if not response.text:
        return None
    try:
        return response_model.model_validate_json(response.text)
    except ValidationError:
        return None
