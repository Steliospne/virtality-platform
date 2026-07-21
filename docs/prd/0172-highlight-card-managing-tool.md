# Handoff: Highlight Card managing tool

**Map:** [Highlight Card managing tool — way to agent handoff spec](https://github.com/Steliospne/virtality-platform/issues/165)  
**Assembly ticket:** [Assemble the Highlight Card agent handoff spec](https://github.com/Steliospne/virtality-platform/issues/172)  
**Status:** Ready for implementers / AFK agents  
**Domains:** `apps/adminboard`, `apps/website`, `packages/db`, `packages/shared`, `packages/orpc`, `packages/react-query` (server mounts oRPC as today)

This document is the **agent-ready handoff**. Implement the feature from this spec; do not re-litigate closed map decisions. Soft items are marked **(soft)**.

---

## Goal

Ship a **generic Adminboard Highlight Card Collection editor** used by two Content nav entries (**Benefits**, **Features**), each editing its own collection. Persist via the existing marketing Prisma + oRPC + react-query stack. Website Benefits and Features **Highlight Card grids** consume the public list; empty collection hides that grid. Rename website `FeatureCard` to Highlight Card naming and fix invalid-icon crash so the locked Lucide fallback holds.

This handoff is **done when the feature works end-to-end**, not when this file exists.

---

## Glossary (use these terms)

| Term                          | Meaning                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| **Highlight Card**            | Title, body, Lucide icon name. Website owns style; Adminboard manages copy + icon only. |
| **Highlight Card Collection** | Ordered set of Highlight Cards for one landing placement: `benefits` or `features`.     |

Avoid: feature card, benefit card, info card, card list, feature set, benefit set.

Already in `apps/adminboard/CONTEXT.md` and `apps/website/CONTEXT.md`.

---

## Out of scope

- Section chrome (eyebrows, section titles, pilot metrics) — remains code-owned.
- Draft / staged publish workflow — save is immediately live.
- Third-party CMS.
- Website-faithful Adminboard card mock / style preview.
- A second Features-only reinvented tool — Features reuses the generic editor.
- Managing the non-grid Benefits list UI chrome beyond what already shares seed copy (see Website).

---

## Stack pattern (mirror existing marketing tools)

Full research: [`docs/research/marketing-content-pattern.md`](../research/marketing-content-pattern.md) · [Research how existing marketing Content tools reach the website](https://github.com/Steliospne/virtality-platform/issues/166)

```
Prisma Marketing* → @virtality/shared (Zod + store port + domain fns)
  → oRPC (public base GET, authed mutations)
  → @virtality/react-query hooks
  → Adminboard Content pages / website sections
```

Closest analogues:

| Need                         | Mirror                                     |
| ---------------------------- | ------------------------------------------ |
| Ordered list + reorder       | Partner logos                              |
| Two placements, one tool     | Collection enum (like logo `category`)     |
| Cutover seed                 | Promo video migration seed                 |
| Empty → hide section surface | Partner empty / promo clear / mosaic empty |

**Do not invent:** draft tables, website-only APIs, absolute image URLs, or a different transport than oRPC + react-query.

---

## Data model

Decision: [Pin the Highlight Card data model within the marketing Prisma pattern](https://github.com/Steliospne/virtality-platform/issues/170)

### Prisma (`packages/db/console/prisma/models/`)

New file e.g. `marketing-highlight-card.prisma`:

```prisma
enum HighlightCardCollection {
  benefits
  features
}

model MarketingHighlightCard {
  id         String                   @id
  collection HighlightCardCollection
  title      String
  body       String
  iconName   String
  sortOrder  Int
  createdAt  DateTime                 @default(now()) @db.Timestamp(6)
  updatedAt  DateTime                 @updatedAt @db.Timestamp(6)

  @@index([collection, sortOrder])
}
```

Rules:

- **Stable UUID `id`** on create (`generateUUID` like partner logos). Reorder only changes `sortOrder`.
- **No** unique on `(collection, sortOrder)` (swap-style reorder).
- **No** DB max-count constraint — max **6** per collection in `@virtality/shared` domain + oRPC (+ UI).
- Plain `String` fields; length/required rules in domain (not `@db.VarChar`).

### Field constraints

Decision: [Pin Highlight Card field constraints](https://github.com/Steliospne/virtality-platform/issues/168)

On save (Adminboard + API):

| Field      | Rule                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| `title`    | Required after trim; max **80**                                              |
| `body`     | Required after trim; max **280**; internal spaces/newlines OK after trim     |
| `iconName` | Required after trim (non-empty); must also pass Lucide resolvability (below) |

### Seed

Migration seeds **both** collections from today’s website hard-coded lists (6 Benefits + 6 Features):

- Benefits: `apps/website/sections/benefits/content.ts` → `LANDING_BENEFITS` (`description` → `body`)
- Features: `apps/website/sections/features/content.ts` → `features` (`context` → `body`)

Preserve titles, bodies, and icon names. Assign stable UUIDs and `sortOrder` 0..n-1 per collection.

---

## Shared domain + API

### `@virtality/shared`

- Types + Zod schemas for list items and mutation inputs (collection enum, create/update/reorder/remove).
- Store port (partner-logo style): findById, list by collection / listAll, create, update, delete, findMaxSortOrder, reorder helpers.
- Domain ops enforce: trim/length rules, max 6 on create, Lucide name resolvability if validation lives here (or call a shared `isLucideIconName` helper used by Adminboard + API).
- Map DB records → list items (no `cdnUrl` — Highlight Cards have no bucket media).

### oRPC (`packages/orpc`)

Register on the router like partner logos. Suggested surface (names flexible; behavior locked):

| Procedure                       | Auth   | Behavior                                                           |
| ------------------------------- | ------ | ------------------------------------------------------------------ |
| `list` / list-by-collection GET | public | Ordered cards; filter by `collection` query or return both grouped |
| `create`                        | authed | Append to collection if under max 6                                |
| `update`                        | authed | Patch title/body/iconName                                          |
| `reorder`                       | authed | Up/down swap `sortOrder` within collection                         |
| `remove`                        | authed | Delete by id                                                       |

Save is **immediately live** (no publish flag).

### React Query (`packages/react-query`)

Query + mutation hooks with invalidate-on-success, same package used by Adminboard and website.

---

## Adminboard UX

### Composition / nav

Decision: [Decide how Content nav entries compose the generic Highlight Card tool](https://github.com/Steliospne/virtality-platform/issues/169)

- Two **thin pages**: `/benefits` and `/features` (not a parameterized route).
- Each mounts the **same** shared editor with a closed prop: `collection: 'benefits' | 'features'`.
- Nav labels: **Benefits**, **Features**.
- H1 matches nav; short placement-specific blurb **(soft copy)**.
- Content nav order: Partner logos → Promo video → Mosaic → **Benefits** → **Features** → Email.
- Sidebar Lucide icons: implementer choice **(soft)**.

### Editor shape

Decision: [Prototype the Highlight Card Collection editor](https://github.com/Steliospne/virtality-platform/issues/171)  
Primary source (all variants): branch [`prototype/highlight-card-collection-editor`](https://github.com/Steliospne/virtality-platform/tree/prototype/highlight-card-collection-editor) — **Variant A** won.

Implement **list + dialog** (partner-logos analogue):

1. Ordered list rows: icon well preview, title, body preview.
2. Up / down reorder controls.
3. Edit / Add opens a **dialog**: title, body, searchable Lucide picker with **live preview**.
4. Remove from the row (confirm dialog **(soft)** — match partner-logo remove pattern).
5. **Add** disabled at 6 cards.
6. Empty collection: dashed empty state **(soft copy)** — website grid would hide.

Prototype constraints that **do not** carry to production:

- In-memory store, curated icon shortlist in the prototype picker, amber switcher — replace with real API + full Lucide resolvability check (no curated allowlist).

### Lucide picker (Adminboard)

Map locks: searchable Lucide picker with live preview; **no curated allowlist**.

- Validate that the name resolves to a **renderable icon component** in the same Lucide major/version story as the website (pin versions so Adminboard preview and website agree — see research).
- Do **not** treat `keyof typeof import('lucide-react')` as a safe allowlist (includes non-icon exports).
- Persist only names that pass that check.

Research: [`docs/research/lucide-highlight-card-icons.md`](../research/lucide-highlight-card-icons.md) · [Research Lucide icon loading and missing-icon behavior on the website](https://github.com/Steliospne/virtality-platform/issues/167)

---

## Website

### Consumers

- **Benefits Highlight Card grid:** `sections/benefits/components/benefits-grid.tsx` (today maps `LANDING_BENEFITS` → shared card).
- **Features grid:** `sections/features/features.tsx` (today maps `features` → shared card).

Fetch public list for the matching collection; map `body` into the section’s existing prop (`ctx` / description) until/as the shared component is renamed.

**Empty collection → hide that section’s Highlight Card grid** (do not render an empty grid). Section chrome outside the grid stays as today unless it becomes nonsensical without cards — prefer hide the grid/section surface that is the Highlight Card placement **(soft:** match how BenefitsGrid / Features are composed on `app/page.tsx`).

### Rename + Lucide runtime guard

1. Rename `FeatureCard` → Highlight Card naming (file/component exports, imports, glossary alignment). Avoid “feature card” in new code.
2. In the shared Highlight Card component: after `import('lucide-react')`, **only** set the glyph if `mod[name]` is a renderable component; otherwise leave the glyph empty. Icon well **background always renders**.
3. This must hold for invalid persisted names so the locked fallback is true even if bad data slips through.

### Static content cleanup

Remove hard-coded Highlight Card arrays from Benefits/Features content once the API is live and seeded. Keep section chrome copy (eyebrows, titles, etc.) code-owned.

### Fetch / caching **(soft)**

Not pinned on the map. Default: same approach as other marketing website consumers (`usePartnerLogos` / `usePromoVideo` / `useMosaic` style react-query hooks). Do not invent a separate caching stack. Revalidation details can follow existing website marketing patterns.

---

## Concurrent edits **(soft)**

Not pinned. Default: **last save wins** (no optimistic locking). Match partner logos.

---

## Suggested implementation order

1. Prisma model + migration seed (both collections).
2. Shared types, store port, domain validation (incl. max 6 + Lucide check).
3. oRPC procedures + router registration.
4. React Query hooks.
5. Shared Adminboard editor (Variant A) + `/benefits` + `/features` thin pages + sidebar nav.
6. Website: rename shared card, Lucide guard, wire Benefits grid + Features to public list, remove static card arrays.
7. Manual smoke: reorder/add/remove/edit live on website; empty collection hides grid; invalid icon name cannot save and/or degrades to empty well.

---

## Acceptance checklist

- [ ] Benefits and Features Adminboard pages edit independent collections via one shared editor.
- [ ] Max 6 enforced in UI and API; field constraints enforced.
- [ ] Reorder / add / remove / edit persist immediately; website reflects without redeploy.
- [ ] Migration seed matches today’s live Benefits + Features card copy and icons.
- [ ] Empty collection hides that placement’s Highlight Card grid.
- [ ] Lucide picker is searchable with live preview; no curated allowlist; only resolvable icon components persist.
- [ ] Invalid icon name does not crash the website card; empty well + background.
- [ ] `FeatureCard` renamed to Highlight Card naming in website code.
- [ ] Section chrome remains unmanaged by this tool.

---

## Decision index (map)

| Topic                | Issue                                                               |
| -------------------- | ------------------------------------------------------------------- |
| Marketing stack      | [#166](https://github.com/Steliospne/virtality-platform/issues/166) |
| Lucide load/fallback | [#167](https://github.com/Steliospne/virtality-platform/issues/167) |
| Field constraints    | [#168](https://github.com/Steliospne/virtality-platform/issues/168) |
| Nav / composition    | [#169](https://github.com/Steliospne/virtality-platform/issues/169) |
| Data model           | [#170](https://github.com/Steliospne/virtality-platform/issues/170) |
| Editor UX (A)        | [#171](https://github.com/Steliospne/virtality-platform/issues/171) |
| This handoff         | [#172](https://github.com/Steliospne/virtality-platform/issues/172) |
| Map                  | [#165](https://github.com/Steliospne/virtality-platform/issues/165) |
