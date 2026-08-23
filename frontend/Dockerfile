FROM node:20-alpine

WORKDIR /frontend

RUN npm install -g serve
COPY build/ build/

CMD ["serve", "-s", "build", "-l", "3000"]