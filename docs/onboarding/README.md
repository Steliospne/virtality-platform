# Onboarding (local suite)

For experienced fullstack engineers joining this monorepo. Goal: run **website**, **console**, **adminboard**, **server**, and **socket** against a fresh local database with a seeded admin login.

Agent/git/domain conventions live under [`docs/agents/`](../agents/) and [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md). This doc is the human runbook.

## Prerequisites

**Before anything else:** finish OS install on **[Machine setup](./machine-setup.md)** (Linux, macOS, or Windows/WSL), then run the verify checks on that page. Do not start install/`pnpm` here until those pass.

You need:

- Node **>= 24** and **pnpm** (see root `packageManager`)
- Docker (for local Postgres via `pnpm db:up`)
- Doppler CLI for secrets (see [Doppler secrets](./doppler.md))

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
pnpm build
```

`pnpm install` pulls workspace deps. `pnpm build` compiles packages the apps depend on (shared libs, Prisma client consumers, etc.) so `pnpm dev:apps` does not start from a cold tree.

## 2. Env files

**Preferred:** pull secrets from Doppler (see **[Doppler secrets](./doppler.md)**), then materialize gitignored `.env` files per package.

Fallback if Doppler is not set up yet: copy each `.env.example` to `.env` in:

- `packages/db`
- `apps/console`
- `apps/adminboard`
- `apps/website`
- `services/server`
- `services/socket`

Examples include a working local `CONSOLE_DATABASE_URL` for Compose Postgres. Generate a real `BETTER_AUTH_SECRET` for the server.

**Stripe / Google** can stay empty in development: the auth package skips the Stripe plugin and Google provider when those keys are missing.

### Sharing real secrets

Do not commit filled `.env` files. Team source of truth is **Doppler** ([setup + migrate + new machine / new developer](./doppler.md)). Background comparison of other tools: [`docs/research/secret-vaults-local-dev.md`](../research/secret-vaults-local-dev.md).

## 3. Database

First start local Postgres, then apply migrations + seed:

```sh
pnpm db:up
pnpm db:migrate:dev
```

### `pnpm db:up`

Starts the Compose Postgres from `infra/docker/compose.db.yml` in the background (`docker compose … up -d`). Defaults match the example `.env` URLs:

| Setting          | Value                               |
| ---------------- | ----------------------------------- |
| Image            | `postgres:17`                       |
| Host port        | `5434` (container `5432`)           |
| User / pass / db | `devuser` / `devpass` / `devdb`     |
| Volume           | `pg_data` (data survives `db:down`) |

Stop the container with `pnpm db:down` (volume kept). Docker must be running; if the port is busy, free `5434` or change the Compose mapping and your `CONSOLE_DATABASE_URL`.

### Useful `db:*` scripts

| Script                   | What it does                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| `pnpm db:up`             | Start local Postgres                                                         |
| `pnpm db:down`           | Stop local Postgres                                                          |
| `pnpm db:migrate:dev`    | Apply pending migrations, then seed (Prisma 7 no longer seeds automatically) |
| `pnpm db:seed`           | Seed only (re-run seed without migrating)                                    |
| `pnpm db:studio`         | Open Prisma Studio against the local DB                                      |
| `pnpm db:generate`       | Regenerate the Prisma client                                                 |
| `pnpm db:reset`          | Wipe DB, re-apply migrations, seed (destructive; local only)                 |
| `pnpm db:migrate:deploy` | Apply migrations without seed (closer to staging/prod)                       |

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
