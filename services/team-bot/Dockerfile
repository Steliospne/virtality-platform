# Build from monorepo root (target the VPS arch — usually amd64):
#   docker build --platform linux/amd64 -f services/team-bot/Dockerfile -t virtality-team-bot .
#
# Secrets come from Compose (infra repo: team-bot/.env.production).

FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

# Only the bot and the workspace packages it imports; the rest of the
# monorepo (Prisma, Next apps) is not needed and would slow the build.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .pnpmfile.cjs ./
COPY tooling/typescript-config ./tooling/typescript-config
COPY packages/shared ./packages/shared
COPY services/team-bot ./services/team-bot

RUN pnpm install --frozen-lockfile --filter @virtality/team-bot...
RUN pnpm --filter @virtality/team-bot... run build
# Self-contained copy of the bot with production deps only, so the runtime
# image does not carry the workspace or dev tooling.
RUN pnpm deploy --legacy --filter @virtality/team-bot --prod /out

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
ENV ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /out ./

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
