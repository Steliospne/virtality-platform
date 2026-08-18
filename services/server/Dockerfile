# Build from monorepo root (target the VPS arch — usually amd64):
#   docker build --platform linux/amd64 -f services/server/Dockerfile -t virtality-server:preview .
#
# Runtime requires LISTEN=true (and real secrets via Compose/env).

FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

FROM base AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .pnpmfile.cjs ./
COPY tooling ./tooling
COPY packages ./packages
COPY apps ./apps
COPY services ./services

# prisma generate reads this via prisma.config.ts; generate does not connect.
ENV CONSOLE_DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

RUN pnpm install --frozen-lockfile
RUN pnpm build:server

FROM base AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV LISTEN=true

COPY --from=builder --chown=node:node /app /app

USER node

EXPOSE 8080

CMD ["pnpm", "--filter", "@virtality/server", "start"]
