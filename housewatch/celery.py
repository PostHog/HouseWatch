import os

from celery import Celery
from celery.schedules import crontab
from django_structlog.celery.steps import DjangoStructLogInitStep

# set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "housewatch.settings")

app = Celery("housewatch")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Make sure Redis doesn't add too many connections
# https://stackoverflow.com/questions/47106592/redis-connections-not-being-released-after-celery-task-is-complete
app.conf.broker_pool_limit = 0

app.steps["worker"].add(DjangoStructLogInitStep)


@app.on_after_configure.connect
def setup_periodic_tasks(sender: Celery, **kwargs):
    # Send all customer usage report to PostHog
    sender.add_periodic_task(
        crontab(hour=4, minute=0), simple.s(), name="send customer usage report"
    )


@app.task(ignore_result=True)
def simple():
    print("ok")
    print("ok")
    print("ok")
    print("ok")
    print("ok")
    print("ok")
    print("ok")
    print("ok")
