# Build the posthog image, incorporating the Django app along with the frontend,
# as well as the plugin-server
FROM python:3.9

ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY requirements.txt ./
RUN pip install -r requirements.txt --compile --no-cache-dir

USER root

# RUN addgroup -S posthog && \
#     adduser -S posthog -G posthog

# RUN chown posthog.posthog /code

# USER posthog

COPY manage.py manage.py
COPY housewatch housewatch/
COPY bin bin/

RUN DEBUG=1 python manage.py collectstatic --noinput

# USER posthog

# Expose container port and run entry point script
EXPOSE 8100

CMD ["./bin/docker"]
