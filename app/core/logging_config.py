import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(log_level: str = "INFO"):

    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)

    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level))

    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level))
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)

    # File Handler with rotation
    file_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=10485760,  # 10 MB
        backupCount=5,
    )
    file_handler.setLevel(getattr(logging, log_level))
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)

    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logger.info(f"Logging configured with level: {log_level}")
