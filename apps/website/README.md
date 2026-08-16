# Website

Public marketing site (landing, blog, waitlist, contact).

Domain language: [`CONTEXT.md`](./CONTEXT.md).  
Suite setup: [`docs/onboarding/README.md`](../../docs/onboarding/README.md).

## Run locally

Port: **3000** (Next default)

```sh
# From repo root (also starts server)
pnpm dev:website

# Or full suite
pnpm dev:apps
```

Copy [`.env.example`](./.env.example) to `.env`.

## Env

| Variable            | Required for local | Notes                                      |
| ------------------- | ------------------ | ------------------------------------------ |
| `REVALIDATE_SECRET` | yes for revalidate | Must match `services/server`               |
| `NEXT_PUBLIC_ENV`   | yes                | `development`                              |
| PostHog tokens      | no                 | Analytics disabled if public token missing |

No auth login on this app.
