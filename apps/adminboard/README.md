# Adminboard

Internal admin dashboard for platform resources and operational content.

Domain language: [`CONTEXT.md`](./CONTEXT.md).  
Suite setup: [`docs/onboarding/README.md`](../../docs/onboarding/README.md).

## Run locally

Port: **3002**

```sh
# From repo root (also starts server)
pnpm dev:adminboard

# Or full suite
pnpm dev:apps
```

Copy [`.env.example`](./.env.example) to `.env`. Minimum:

- `NEXT_PUBLIC_ENV=development`
- `DATABASE_URL`

Requires a user with `role=admin`. The local seed creates one (see onboarding).

## Env

| Variable          | Required for local | Notes                           |
| ----------------- | ------------------ | ------------------------------- |
| `NEXT_PUBLIC_ENV` | yes                | `development`                   |
| `ENV`             | recommended        | `development`                   |
| `DATABASE_URL`    | yes                | Used by the Next proxy / Prisma |

Seeded admin:

- Email: `dev@virtality.local`
- Password: `password`
