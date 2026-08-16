# Console

Clinician-facing web app for patients, therapy plans, and rehab workflows.

Domain language: [`CONTEXT.md`](./CONTEXT.md).  
Suite setup: [`docs/onboarding/README.md`](../../docs/onboarding/README.md).

## Run locally

Port: **3001**

```sh
# From repo root (also starts server + orpc)
pnpm dev:console

# Or full suite (website + console + adminboard + server + socket)
pnpm dev:apps
```

Copy [`.env.example`](./.env.example) to `.env`. Minimum:

- `NEXT_PUBLIC_ENV=development`
- `CONSOLE_DATABASE_URL` (same local Postgres as `packages/db`)

Auth and API traffic go to `services/server` (`http://localhost:8080`).

## Env

| Variable                        | Required for local | Notes                           |
| ------------------------------- | ------------------ | ------------------------------- |
| `NEXT_PUBLIC_ENV`               | yes                | `development`                   |
| `ENV`                           | recommended        | `development`                   |
| `CONSOLE_DATABASE_URL`          | yes                | Used by the Next proxy / Prisma |
| `NEXT_PUBLIC_POSTHOG_KEY`       | no                 | Analytics                       |
| `NEXT_PUBLIC_CDN_URL` / AWS\_\* | no                 | Uploads / media                 |

After `pnpm db:migrate:dev`, sign in as the seeded admin:

- Email: `dev@virtality.local`
- Password: `password`
