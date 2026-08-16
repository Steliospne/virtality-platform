# Socket

Real-time bridge between the console frontend and VR headsets during treatment workflows.

Domain language: [`CONTEXT.md`](./CONTEXT.md).  
Suite setup: [`docs/onboarding/README.md`](../../docs/onboarding/README.md).

## Run locally

Port: **8081** (default)

```sh
# From repo root
pnpm --filter @virtality/socket dev

# Included in the full suite
pnpm dev:apps
```

Copy [`.env.example`](./.env.example) to `.env`. The `dev` script requires that file (`--env-file=.env`).

## Env

| Variable | Required for local | Notes                            |
| -------- | ------------------ | -------------------------------- |
| `ENV`    | recommended        | `development`                    |
| `PORT`   | no                 | Defaults to `8081`               |
| `SIM`    | no                 | `true` to simulate headset flows |

No database connection is required for the socket process itself.
