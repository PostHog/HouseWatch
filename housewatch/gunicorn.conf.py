import logging

from gunicorn import glogging


class CustomGunicornLogger(glogging.Logger):
    def setup(self, cfg):
        super().setup(cfg)

        # Add filters to Gunicorn logger
        logger = logging.getLogger("gunicorn.access")
        logger.addFilter(HealthCheckFilter())


class HealthCheckFilter(logging.Filter):
    def filter(self, record):
        return "GET /healthz" not in record.getMessage()


accesslog = "-"
logger_class = CustomGunicornLogger
log_level = "info"

bind = "0.0.0.0:8100"
workers = 2
