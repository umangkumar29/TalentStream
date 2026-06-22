import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Configure structured JSON logging for production observability."""
    logger = logging.getLogger()
    log_handler = logging.StreamHandler(sys.stdout)
    
    # In production, JSON logs are easier for ELK/Datadog to parse
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    log_handler.setFormatter(formatter)
    
    logger.addHandler(log_handler)
    logger.setLevel(logging.INFO)
    
    # Filter out noisy library logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)

    return logger

logger = setup_logging()
