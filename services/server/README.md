# Server

Platform API: Better Auth, oRPC, and shared HTTP endpoints used by console, adminboard, and website.

Domain language: [`CONTEXT.md`](./CONTEXT.md).  
Suite setup: [`docs/onboarding/README.md`](../../docs/onboarding/README.md).

## Run locally

Port: **8080**

```sh
# From repo root (pulled in by pnpm dev:* scripts)
pnpm --filter @virtality/server dev

# Or full suite
pnpm dev:apps
```

Copy [`.env.example`](./.env.example) to `.env` before starting. The `dev` script loads `.env` via `--env-file`.

## Env

| Variable                  | Required for local         | Notes                                        |
| ------------------------- | -------------------------- | -------------------------------------------- |
| `CONSOLE_DATABASE_URL`    | yes                        | Shared console Postgres                      |
| `ENV` / `NEXT_PUBLIC_ENV` | yes                        | `development`                                |
| `BETTER_AUTH_SECRET`      | yes                        | Any long random string locally               |
| `BETTER_AUTH_URL`         | recommended                | `http://localhost:8080`                      |
| `REVALIDATE_SECRET`       | yes for website revalidate | Match website                                |
| `STRIPE_SECRET_KEY`       | no in development          | If omitted, Stripe plugin is not registered  |
| `GOOGLE_CLIENT_*`         | no                         | If omitted, Google sign-in is disabled       |
| SMTP\_\*                  | no for seeded admin        | Needed for new email sign-ups / verification |

Do not use the Vercel CLI path for day-to-day monorepo work; prefer the turbo/`tsx` scripts above.
