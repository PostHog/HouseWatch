FROM python:3.10

ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY requirements.txt ./
RUN pip install -r requirements.txt --compile --no-cache-dir

USER root

COPY manage.py manage.py
COPY housewatch housewatch/
COPY bin bin/

RUN DEBUG=1 python manage.py collectstatic --noinput
