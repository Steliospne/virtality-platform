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

| Variable | Required for local | Notes              |
| -------- | ------------------ | ------------------ |
| `ENV`    | recommended        | `development`      |
| `PORT`   | no                 | Defaults to `8081` |

No database connection is required for the socket process itself.

## Simulated Headset

A standalone client that joins a room as the `vr` peer and answers program and
video events the way the headset build does. The server carries no simulation
code; run it against a normally-running socket server:

```sh
# ROOM_CODE is the device id shown in the console's device dropdown
ROOM_CODE=<deviceId> pnpm --filter @virtality/socket dev_sim

# Point at another server (defaults to http://localhost:8081)
SOCKET_URL=http://localhost:8081 ROOM_CODE=<deviceId> pnpm --filter @virtality/socket dev_sim
```

The library starts empty. Any `videoId` downloads in about 10 s with progress
ticks; an id prefixed `fail-` answers `videoDownloadFailed { reason: 'unavailable' }`.
Timings live in `src/sim/simulated-headset.ts`.
