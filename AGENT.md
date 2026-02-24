# AGENT Notes: `refactor/` Monorepo

This document captures my current understanding of the `refactor/` workspace as it exists now.
It is intentionally "state of reality" (what is implemented) rather than "target architecture" (what is planned).

## 1) What This Repository Is

- This is a temporary monorepo scaffold created from previously separate Virtality repositories.
- The root uses `pnpm` workspaces plus `turbo` for orchestration.
- The scaffold keeps most original app/service structures intact, so there is still significant duplication and drift.
- Several packages in `packages/` are placeholders and not yet implemented as real shared libraries.

## 2) Workspace Layout and Responsibilities

### `apps/`

- `apps/console` (`virtality-console`): Main product Next.js app (patient/program/session workflows, i18n, device and socket-driven VR workflows).
- `apps/adminboard` (`virtality-adminboard`): Internal/admin Next.js dashboard used to monitor business metrics and manage business-related resources (patients, presets, exercises, avatars, referrals, etc.).
- `apps/website` (`virtality-website`): Marketing/public site with waitlist, contact, booking, and integrations (Slack, Zoom, Resend, PostHog).

### `services/`

- `services/server` (`virtality-server`): Express service hosting Better Auth (`/api/auth/*`) plus partial `/api/v1` APIs (`me`, `devices`, `email`; `users`/`exercises` are mostly placeholders).
- `services/socket` (`virtality-socket`): Express + Socket.IO realtime service for room-based communication between the app and VR headset flows.

### `packages/`

- `packages/db` (`@virtality/db`): Prisma schema/migrations and generated Prisma client package.
- `packages/orpc` (`@virtality/orpc`): oRPC API contract and procedures; used by server (mount at `/api/v1/rpc`) and console (client in `integrations/orpc/client.ts`). Procedures: me, patient, patient-session, device, exercise, map, medical-history, avatar, supplemental-therapy, program, program-exercise.
- `packages/auth` (`@virtality/auth`): Better Auth setup and handler; consumed by server and apps.
- `packages/shared` (`@virtality/shared`): Shared utilities and types. Exports `./utils` (e.g. `generate-img-file`, `uuid`) and `./types` (e.g. mime-types, session-schema). No root barrel; previous root `index.ts`/`types.ts` removed.
- `packages/ui`: placeholder.
- `packages/eslint-config` (`@virtality/eslint-config`): shared ESLint flat config package.
- `packages/typescript-config` (`@virtality/typescript-config`): shared base/next/node TypeScript configs.

### `infra/`

- `infra/docker`: collected compose files.
- `infra/github`: collected workflow files.
- `infra/scripts`: collected DB setup/clone scripts.

## 3) Architecture Reality (Important)

### Shared data layer

- All major apps/services consume `@virtality/db` (workspace package) and instantiate their own Prisma clients.
- Direct DB access exists in multiple Next apps (`apps/console`, `apps/adminboard`, `apps/website`) and in `services/server`.
- Backend/data ownership is currently distributed, not centralized.

### Auth boundary

- Auth server authority is in `services/server/src/auth.ts` using Better Auth.
- `apps/console` and `apps/adminboard` fetch current session/user from server `/api/v1/me`.
- `apps/website` has a minimal `auth-client.ts` with hardcoded localhost base URL, and its local `auth.ts` is commented legacy code.

### API boundary

- Central API is served by `services/server` via **oRPC** at `/api/v1/rpc` (ORPC_PREFIX). Procedures live in `packages/orpc` (me, patient, patient-session, device, exercise, map, medical-history, avatar, supplemental-therapy, program, program-exercise). Auth is separate: Better Auth at `/api/v1/auth/*`.
- Console uses the ORPC client from `apps/console/integrations/orpc/client.ts` (points at `NEXT_PUBLIC_SERVER_URL` + ORPC_PREFIX).
- Next apps may still expose app-local `/api/*` routes and use `data/server/*` + Prisma; app-local and central ORPC coexist.

### Realtime boundary

- `services/socket` maintains in-memory room state (`Map<string, Room>`) and relays registered event contracts.
- `apps/console` consumes socket events and contains substantial session/progress behavior tied to these events.
- Socket event/type contracts are duplicated between `services/socket/src/types/models.ts` and `apps/console/types/models.ts` (no shared package yet).

## 4) Tooling and Operational State

- Root workspace config:
  - `package.json` scripts: `dev`, `build`, `lint`, `type-check`, `format` via `turbo`.
  - `pnpm-workspace.yaml`: includes `apps/*`, `services/*`, `packages/*`.
  - `turbo.json`: standard task graph with `build`, `dev`, `lint`, `type-check`, `format`.
- Local `workspace:*` links are used for shared packages: `@virtality/db`, `@virtality/orpc`, `@virtality/auth`, `@virtality/shared`, `@virtality/eslint-config`, `@virtality/typescript-config`.
- A single root `pnpm-lock.yaml` is used; nested lockfile/workspace artifacts were removed.
- Turbo: `build:packages` runs build for shared, db, orpc, auth, ui; `dev:console` runs console + server + orpc.
- Package manager usage is mixed:
  - Many projects use `pnpm`.
  - Some scripts/workflows still use `npm` (for example `update:prisma`, migration workflows).

## 5) Runtime Ports and Main Endpoints

- `apps/website`: Next dev default (`3000`).
- `apps/console`: Next dev on `3001`.
- `apps/adminboard`: Next dev on `3002`.
- `services/server`: Express on `8080` (default).
- `services/socket`: Socket service on `8081` (default).
- Local Postgres in compose files: host port `5434` -> container `5432`.

Key central endpoints:

- `/api/v1/auth/*` (Better Auth handler)
- `/api/v1/rpc` (oRPC procedure endpoint; me, patient, patient-session, device, exercise, map, etc.)

## 6) Key Environment Variables (Observed)

- Core DB/auth connectivity:
  - `DATABASE_URL`
  - `BETTER_AUTH_URL`
  - `NEXT_PUBLIC_AUTH_URL`
  - `NEXT_PUBLIC_SOCKET_URL`
  - `NEXT_PUBLIC_MOBILE_DEV`
- Central auth/email/payments:
  - `FROM_AUTH_ALIAS`, `FROM_MAIL_ALIAS`
  - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Website integrations:
  - `RESEND_API_KEY`
  - `SLACK_APPOINTMENT_WEBHOOK_URL`, `SLACK_MESSAGE_WEBHOOK_URL`
  - `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID`
  - `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

## 7) Notable Drift and Risks

- Version drift across projects (Next/React/Prisma/etc. versions may differ per workspace).
- API boundary: ORPC is the central API surface; app-local data/API usage in Next apps still exists (e.g. `data/server/*`), so backend ownership is split.
- Domain duplication (patients/presets/exercises and related logic repeated across console and adminboard).
- Socket/event types duplicated between socket service and console; no shared contract package.
- `packages/ui` remains a placeholder; shared `auth-client` / API contracts not fully extracted.
- CI/CD is copied but fragmented; workflows are not yet fully monorepo-native.
- Infra/config duplication (compose files, DB setup scripts, auth/prisma bootstrap patterns).

## 8) Fast Orientation Guide for Future Work

If you need to make changes quickly, start here:

- Server auth: `services/server` uses `@virtality/auth`; auth routes at `/api/v1/auth/*`.
- Server API: oRPC at `/api/v1/rpc` via `packages/orpc`; middleware in `services/server/src/middleware/orpc.ts`.
- ORPC procedures: `packages/orpc/src/procedures/*`; router in `packages/orpc/src/router.ts`.
- Console ORPC client: `apps/console/integrations/orpc/client.ts`.
- Socket event registry/rooms: `services/socket/src/sockets/prod-server.ts`.
- Console VR socket handling: `apps/console/hooks/use-patient-dashboard-socket-setup.tsx`.
- Console server-side data: `apps/console/data/server/*`; patient-session hooks in `hooks/mutations/patient-session/`, `hooks/queries/patient-session/`.
- Adminboard server-side data: `apps/adminboard/data/server/*`.
- Schema source of truth: `packages/db` (Prisma under `packages/db/console/`).

## 9) Suggested Next Refactor Moves

1. Decide and enforce one backend boundary model: service-oriented (apps call server/socket + ORPC) vs app-local BFF with shared domain packages.
2. Unify socket/event types between `services/socket` and `apps/console` (single source of truth, e.g. in `@virtality/shared` or a dedicated types package).
3. Migrate remaining app-local API or data paths to ORPC procedures where it reduces duplication.

## 10) AGENT.md Maintenance Protocol (For Future Agents)

Treat this file as a living operational map, not static documentation.

- Update `AGENT.md` whenever your work changes architecture, folder ownership, runtime behavior, tooling flow, or integration boundaries.
- If the user corrects your understanding (or points out stale/incorrect assumptions), reflect that correction in `AGENT.md` in the same task when possible.
- Consider `AGENT.md` updates part of "definition of done" for non-trivial work.
- Prefer small, frequent updates over large delayed rewrites.
- When unsure whether a change matters, err on the side of documenting it briefly.

Recommended habit for every task:

1. Before implementing: skim `AGENT.md` for assumptions.
2. After implementing: check whether any section is now outdated.
3. If outdated: patch `AGENT.md` with concise, factual updates before closing the task.

Why this matters:

- Reduces repeated mistakes and user re-corrections.
- Speeds onboarding for future agents.
- Keeps architecture and operational decisions discoverable as the repo evolves.

---

## 11) Potential Todos (Suggested)

- **Socket/event types**: Move socket event names and payload types to a single source (e.g. `@virtality/shared` or a small `socket-contracts` package) and consume from both `services/socket` and `apps/console` to remove duplication in `types/models.ts`.
- **ORPC coverage**: Identify any remaining app-local API or server data paths that could be moved into ORPC procedures for consistency and reuse (e.g. adminboard, website).
- **Website legacy script**: Update or remove `apps/website` script that still references `@virtality/schema` (e.g. `update:prisma`) to use `@virtality/db` and current workspace tooling.
- **Shared auth client**: If consolidating on a service-oriented boundary, extract a shared auth/session client used by console and adminboard (and optionally website) to avoid duplicated auth logic.
- **packages/ui**: Complete or document the intended scope of `packages/ui`; if it remains a placeholder, note that in AGENT.md or remove it from active build/turbo targets.
- **CI/CD**: Align GitHub workflows under `infra/github` with monorepo structure (single install/build, correct workspace filters, shared env/secrets).
- **Console types/models**: Consider moving app-specific types from `apps/console/types/models.ts` into `@virtality/shared` or orpc-related types where they are shared with server or other apps.
