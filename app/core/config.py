import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


DEFAULT_SECRET_KEY = "change-me-in-production-dev-only-key"


def _csv(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]

class Settings:

    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # API Configuration
    api_title: str = os.getenv("API_TITLE", "Dish Assistant API")
    api_version: str = os.getenv("API_VERSION", "1.0.0")
    api_description: str = os.getenv("API_DESCRIPTION", "AI-powered menu navigation for travelers")
    
    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    reload: bool = os.getenv("RELOAD", "true").lower() == "true"
    
    # Database Configuration
    # `or` so empty lines in .env also fall back to the defaults
    mongodb_url: str = os.getenv("MONGODB_URL") or "mongodb://localhost:27017"
    database_name: str = os.getenv("DATABASE_NAME") or "dish_assistant"
    database_echo: bool = os.getenv("DATABASE_ECHO", "true").lower() == "true"
    
    # Authentication
    # `or` so an empty "SECRET_KEY=" line in .env also falls back to the default
    secret_key: str = os.getenv("SECRET_KEY") or DEFAULT_SECRET_KEY
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    # Refresh token lifetime without "Remember me" (cookie is also session-only)
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    # Refresh token lifetime with "Remember me" (cookie persists across browser restarts)
    refresh_token_remember_days: int = int(os.getenv("REFRESH_TOKEN_REMEMBER_DAYS", "30"))

    # Auth cookies (Secure must be true in production, where the site is served over HTTPS)
    cookie_secure: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    cookie_samesite: str = os.getenv("COOKIE_SAMESITE", "lax")

    cors_origins: list = _csv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    cors_allow_credentials: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    cors_allow_methods: list = _csv("CORS_ALLOW_METHODS", "GET,POST,PUT,DELETE")
    cors_allow_headers: list = _csv("CORS_ALLOW_HEADERS", "Content-Type")
    
    # Google Gemini API
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"
    gemini_fallback_model: str = os.getenv("GEMINI_FALLBACK_MODEL") or "gemini-3.1-flash-lite"
    gemini_timeout_seconds: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS") or "60")
    gemini_max_attempts: int = int(os.getenv("GEMINI_MAX_ATTEMPTS") or "3")
    
    
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", "logs/app.log")
    
    # Feature Flags
    enable_ocr: bool = os.getenv("ENABLE_OCR", "false").lower() == "true"
    enable_restaurant_history: bool = os.getenv("ENABLE_RESTAURANT_HISTORY", "false").lower() == "true"


    def validate(self) -> None:
        # Refuse to run in production with a guessable JWT signing key
        if self.environment == "production":
            if self.secret_key == DEFAULT_SECRET_KEY or len(self.secret_key) < 32:
                raise RuntimeError(
                    "SECRET_KEY must be set to a random value of at least 32 characters in production. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
                )
            if not self.cookie_secure:
                raise RuntimeError("COOKIE_SECURE must be true in production.")
            
            unsafe = [o for o in self.cors_origins if o == "*" or "localhost" in o or "127.0.0.1" in o]
            if unsafe:
                raise RuntimeError(
                    f"CORS_ORIGINS has development or wildcard origins in production: {unsafe}. "
                    "Set it to the frontend's URL (e.g. https://dish-assistant.example.com), or leave it empty."
                )


# Create settings instance
settings = Settings()
settings.validate()