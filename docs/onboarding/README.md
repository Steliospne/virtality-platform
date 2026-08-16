# Onboarding (local suite)

For experienced fullstack engineers joining this monorepo. Goal: run **website**, **console**, **adminboard**, **server**, and **socket** against a fresh local database with a seeded admin login.

Agent/git/domain conventions live under [`docs/agents/`](../agents/) and [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md). This doc is the human runbook.

## Prerequisites

First-time machine setup (Git, Node 24+, pnpm, Docker) by OS:

- **[Machine setup](./machine-setup.md)** (Linux, macOS, Windows/WSL)

You need:

- Node **>= 24** and **pnpm** (see root `packageManager`)
- Docker (for local Postgres via `pnpm db:up`)

## Monorepo map

| Path              | Role                               |
| ----------------- | ---------------------------------- |
| `apps/console`    | Clinician app (`:3001`)            |
| `apps/adminboard` | Internal admin (`:3002`)           |
| `apps/website`    | Marketing site (`:3000`)           |
| `services/server` | API + Better Auth (`:8080`)        |
| `services/socket` | Realtime headset bridge (`:8081`)  |
| `packages/*`      | Shared libraries (see table below) |
| `tooling/*`       | ESLint / TypeScript configs        |
| `infra/docker`    | Local Postgres Compose             |

## Packages and tooling (when to touch)

| Unit                        | One-liner                                      |
| --------------------------- | ---------------------------------------------- |
| `packages/auth`             | Better Auth config, Stripe plugin, permissions |
| `packages/db`               | Prisma schema, migrations, seeds, client       |
| `packages/orpc`             | Typed API procedures shared by apps/server     |
| `packages/ui`               | Shared UI components                           |
| `packages/shared`           | URLs, session gate helpers, shared utils       |
| `packages/react-query`      | Query client / SSR wiring for consumers        |
| `packages/nodemailer`       | Transactional email helpers                    |
| `tooling/eslint-config`     | Shared ESLint config                           |
| `tooling/typescript-config` | Shared TSConfigs                               |

Domain detail: read [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md), then the nearest `CONTEXT.md`.

## 1. Install

```sh
pnpm install
```

## 2. Env files

Copy each `.env.example` to `.env` in:

- `packages/db`
- `apps/console`
- `apps/adminboard`
- `apps/website`
- `services/server`
- `services/socket`

Examples include a working local `CONSOLE_DATABASE_URL` for Compose Postgres. Generate a real `BETTER_AUTH_SECRET` for the server.

**Stripe / Google** can stay empty in development: the auth package skips the Stripe plugin and Google provider when those keys are missing.

### Sharing real secrets

Do not commit filled `.env` files. For team secret sharing, compare options in [`docs/research/secret-vaults-local-dev.md`](../research/secret-vaults-local-dev.md) (1Password, Doppler, Infisical, Bitwarden Secrets Manager, HashiCorp). Pick one as a team follow-up; until then, ask a teammate for vault access or values that are not in the examples (SMTP, Stripe test keys, Google OAuth, PostHog).

## 3. Database

```sh
pnpm db:up
pnpm db:migrate:dev
```

`migrate:dev` applies migrations and then runs Prisma seed (Prisma 7 no longer seeds automatically). You can also run:

```sh
pnpm db:seed
```

**Fresh DB is the default.** Cloning a remote DB is optional later when you have a connection string (`apps/console/docs/db-setup.md`).

### Seeded admin (local only)

| Field    | Value                 |
| -------- | --------------------- |
| Email    | `dev@virtality.local` |
| Password | `password`            |
| Role     | `admin`               |

Also seeded: a few patients, programs, exercises, one completed session (+ small session data), and one device, all owned by that admin.

## 4. Start the suite

```sh
pnpm dev:apps
```

That starts console, adminboard, website, server, and socket.

Individual entrypoints: `pnpm dev:console`, `pnpm dev:adminboard`, `pnpm dev:website`.

## 5. Sign in

- Console: http://localhost:3001
- Adminboard: http://localhost:3002
- Website: http://localhost:3000
- API: http://localhost:8080
- Socket: http://localhost:8081

Use the seeded admin on console and adminboard. Billing/Checkout needs Stripe test keys from the vault; without them the suite still boots.

## Per-unit run notes

App and service READMEs own ports, env quirks, and deltas:

- [`apps/console/README.md`](../../apps/console/README.md)
- [`apps/adminboard/README.md`](../../apps/adminboard/README.md)
- [`apps/website/README.md`](../../apps/website/README.md)
- [`services/server/README.md`](../../services/server/README.md)
- [`services/socket/README.md`](../../services/socket/README.md)
