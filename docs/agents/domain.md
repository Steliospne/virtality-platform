# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — lists every bounded context and where its `CONTEXT.md` lives.
- The relevant **`CONTEXT.md`** for the area you're about to work in (see the map below).
- **`docs/adr/`** at the repo root — system-wide architectural decisions.
- Context-scoped ADRs under `<context-path>/docs/adr/` when they exist.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## Context map

| Context    | Path               | Description                                                                                                                                             |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| console    | `apps/console/`    | Clinician/practitioner web app — patients, programs, presets, devices, VR casting, organizations, clinical forms                                        |
| adminboard | `apps/adminboard/` | Internal admin dashboard — resource management (exercises, presets, maps, avatars, patients, users), tester codes, trial redeem codes, email, S3 bucket |
| website    | `apps/website/`    | Public marketing site — landing, blog, waitlist, contact                                                                                                |
| server     | `services/server/` | Platform API — Hono server with tRPC/oRPC, auth middleware, user/device data                                                                            |
| socket     | `services/socket/` | Real-time communication — Socket.IO bridge between console frontend and VR headsets                                                                     |

Shared packages (`packages/db`, `packages/auth`, `packages/orpc`, `packages/shared`, `packages/ui`, etc.) do not have separate contexts. The Prisma schema in `packages/db/console/prisma/` is the shared data-model source of truth — domain terms defined there apply across all contexts.

## File structure

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
├── apps/
│   ├── console/
│   │   ├── CONTEXT.md                 ← created lazily
│   │   └── docs/adr/                  ← context-specific decisions
│   ├── adminboard/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   └── website/
│       ├── CONTEXT.md
│       └── docs/adr/
├── services/
│   ├── server/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   └── socket/
│       ├── CONTEXT.md
│       └── docs/adr/
└── packages/                          ← shared libraries, no separate contexts
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
