# Context Map

Multi-context layout for the Virtality Platform monorepo. Each context has its own `CONTEXT.md` (created lazily by `/grill-with-docs`) and optionally `docs/adr/` for context-specific decisions.

| Context    | Path               | Description                                                                                                                                       |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| console    | `apps/console/`    | Clinician/practitioner web app — patients, programs, presets, devices, VR casting, organizations, clinical forms                                  |
| adminboard | `apps/adminboard/` | Internal admin dashboard — resource management (exercises, presets, maps, avatars, patients, users), tester codes, access codes, email, S3 bucket |
| website    | `apps/website/`    | Public marketing site — landing, blog, waitlist, contact                                                                                          |
| ui-system  | `packages/ui/`     | Shared UI bucket for cross-app components and email templates consumed by multiple contexts                                                       |
| server     | `services/server/` | Platform API — Hono server with tRPC/oRPC, auth middleware, user/device data                                                                      |
| socket     | `services/socket/` | Real-time communication — Socket.IO bridge between console frontend and VR headsets                                                               |

System-wide architectural decisions live in `docs/adr/` at the repo root.

Shared packages (`packages/db`, `packages/auth`, `packages/orpc`, `packages/ui`, etc.) are documented within the contexts that own them. The Prisma schema in `packages/db/console/prisma/` is the cross-context data-model source of truth.

The **Shared UI Bucket** (`packages/ui/`, `@virtality/ui`) is the canonical source for promoted cross-app UI primitives; see `packages/ui/CONTRACT.md`.
