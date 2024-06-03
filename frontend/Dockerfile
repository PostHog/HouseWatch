FROM node:lts-alpine3.20

WORKDIR /frontend

RUN pnpm i && vite build

COPY build/ build/

CMD ["echo", "Serve the files from /frontend/build, don't run this container directly"]