FROM node:20.4.0-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /frontend

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20.4.0-alpine

WORKDIR /frontend

RUN npm install -g serve@14.2.4

COPY --from=builder /frontend/build build/

CMD ["serve", "-s", "build", "-l", "3000"]