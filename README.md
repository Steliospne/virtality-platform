# Virtality Platform

## Structure

### Apps

- `apps/console`
- `apps/adminboard`
- `apps/website`

### Services

- `services/server`
- `services/socket`

### Packages

- `packages/auth`
- `packages/db`
- `packages/orpc`
- `packages/ui`
- `packages/shared`

### Tooling

- `packages/eslint-config`
- `packages/typescript-config`

### Infra

Local/dev Docker helpers live under `infra/docker` (e.g. Postgres). Production VPS proxy and observability stacks are owned by the separate [`Virtality-app/infra`](https://github.com/Virtality-app/infra) repository.

Log field contract: `docs/logging-spec.md`.

## Notes
