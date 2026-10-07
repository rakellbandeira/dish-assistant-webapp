"""Exception handlers that give every error response the same shape.

    {"message": "Human readable text"}
    {"message": "Invalid input.", "errors": [{"field": "password", "message": "..."}]}   (422 only)

The frontend reads (await res.json()).message; see docs/auth-contract.md.
"""
import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when the AI (Gemini) can't give us a usable answer.

    503 = temporarily unavailable, try again · 502 = bad answer from the AI · 504 = too slow
    """

    def __init__(self, message: str, status_code: int = status.HTTP_503_SERVICE_UNAVAILABLE):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def ai_service_exception_handler(request: Request, exc: AIServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"message": exc.message})


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": message},
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for error in exc.errors():
        # loc looks like ("body", "password"); the frontend only needs the field name
        location = [str(part) for part in error.get("loc", ()) if part != "body"]
        text = error.get("msg", "Invalid value.")
        # Pydantic prefixes messages from our own ValueErrors with "Value error, "
        text = text.removeprefix("Value error, ")
        field = ".".join(location) or None
        # "Field required" alone doesn't say which field; name it
        if error.get("type") == "missing" and field:
            text = f"{field} is required."
        errors.append({"field": field, "message": text})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": errors[0]["message"] if len(errors) == 1 else "Invalid input.", "errors": errors},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log the real error, but never leak internals to the client
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Something went wrong on our side. Please try again."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AIServiceError, ai_service_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
