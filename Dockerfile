FROM python:3.10

ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY requirements.txt ./

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    "build-essential" \
    "git" \
    "libpq-dev" \
    "libxmlsec1" \
    "libxmlsec1-dev" \
    "libffi-dev" \
    "pkg-config" \
    && \
    rm -rf /var/lib/apt/lists/* && \
    pip install -r requirements.txt --compile --no-cache-dir


USER root

COPY manage.py manage.py
COPY housewatch housewatch/
COPY bin bin/

RUN DEBUG=1 python manage.py collectstatic --noinput
