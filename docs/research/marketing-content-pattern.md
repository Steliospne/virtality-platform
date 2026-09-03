# Research: Marketing Content tools → website

**Ticket:** [#166 — Research how existing marketing Content tools reach the website](https://github.com/Steliospne/virtality-platform/issues/166)  
**Map:** [#165 — Highlight Card managing tool — way to agent handoff spec](https://github.com/Steliospne/virtality-platform/issues/165)  
**Question:** How do Adminboard marketing Content tools (partner logos, promo video, mosaic) persist data, expose APIs, and get consumed by the website — so Highlight Cards can mirror the same pattern without inventing a new stack?  
**Sources:** in-repo code only (Prisma, oRPC, shared domain utils, react-query, Adminboard, website).  
**Branch:** `research/marketing-content-pattern`

## Verdict

Existing Content tools share one vertical stack:

1. **Prisma models** under `packages/db/prisma/models/marketing-*.prisma` (Marketing\* tables).
2. **Domain logic** in `@virtality/shared` (store interfaces + Zod inputs + `bucketCdnUrl` mapping).
3. **oRPC procedures** in `packages/orpc` — **public `base` GETs** for website/admin reads; **`authed` mutations** for Adminboard writes.
4. **React Query hooks** in `@virtality/react-query` wrapping those procedures.
5. **Adminboard** pages under Content nav + dashboard/editor components.
6. **Website** client sections that call the same public GET hooks and hide when empty / ineligible.

There is **no draft/publish table or CMS**. Save (or assign/create) is immediately live. Empty / cleared / incomplete state hides the section on the website.

Highlight Cards should reuse this stack shape: Prisma marketing model(s) → shared types/utils → public list/get + authed CRUD → react-query hooks → Adminboard Content page → website section fetch + hide-when-empty.

---

## End-to-end flow

```text
Adminboard UI
  → use* mutations (@virtality/react-query)
    → authed oRPC POST/DELETE (packages/orpc)
      → shared domain fn + PartnerLogoStore / PromoVideoStore / MosaicStore
        → Prisma Marketing* tables (packages/db)

Website / Adminboard UI
  → use* queries (@virtality/react-query)
    → public oRPC GET (base, no auth)
      → same shared mappers → { …, cdnUrl: bucketCdnUrl(objectKey) }
        → section render or return null
```

Media bytes live in the **bucket**; marketing rows store **`objectKey` only**. CDN URLs are derived at read time, never stored.

---

## Data model

### Partner logos

Source: `packages/db/prisma/models/marketing-partner-logo.prisma`

| Piece  | Detail                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------- |
| Model  | `MarketingPartnerLogo`                                                                             |
| Fields | `id`, `objectKey` (unique), `alt`, `category` (`strategic` \| `clinical`), `sortOrder`, timestamps |
| Index  | `(category, sortOrder)`                                                                            |
| Shape  | Ordered **collection** of many rows (not a singleton)                                              |

Migration: `packages/db/prisma/migrations/20260717120000_add_marketing_partner_logo/migration.sql` — creates table + enum; **no seed data**.

### Promo video

Source: `packages/db/prisma/models/marketing-promo-video.prisma`

| Piece  | Detail                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Model  | `MarketingPromoVideo`                                                                                                             |
| Fields | `id`, `objectKey` (unique), timestamps                                                                                            |
| Shape  | **Singleton** — domain constant `PROMO_VIDEO_SINGLETON_ID = 'promo-video-singleton'` (`packages/shared/src/utils/promo-video.ts`) |

Migration: `packages/db/prisma/migrations/20260720120000_add_marketing_promo_video/migration.sql` — creates table and **seeds** the prior landing MP4 (`virtality-promo-web-001.mp4`) so the section stays visible after cutover.

### Mosaic

Source: `packages/db/prisma/models/marketing-mosaic.prisma`

| Piece    | Detail                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Parent   | `MarketingLandingMosaic` — fixed id default `"landing"`                                                         |
| Children | `MarketingMosaicTile` — `objectKey`, `mediaKind` (`image` \| `video`), `alt`, grid `row`/`col`/`width`/`height` |
| Shape    | Singleton board + replace-all tiles (transactional deleteMany + createMany)                                     |

Migration: `packages/db/prisma/migrations/20260720120000_add_marketing_mosaic/migration.sql` — creates tables; **no tile seed** (empty board → website hides section until a live-eligible save).

### Bucket references

Marketing object keys participate in bucket “referenced by” checks via `packages/orpc/src/procedures/bucket-reference-reader.ts` (`findPartnerLogoReferences`, `findPromoVideoReferences`, `findMosaicTileReferences`).

---

## Shared types & domain layer

| Domain        | Types                                       | Utils                                       |
| ------------- | ------------------------------------------- | ------------------------------------------- |
| Partner logos | `packages/shared/src/types/partner-logo.ts` | `packages/shared/src/utils/partner-logo.ts` |
| Promo video   | `packages/shared/src/types/promo-video.ts`  | `packages/shared/src/utils/promo-video.ts`  |
| Mosaic        | `packages/shared/src/types/mosaic.ts`       | `packages/shared/src/utils/mosaic.ts`       |

Common patterns in utils:

- **Store port** (`PartnerLogoStore`, `PromoVideoStore`, `MosaicStore`) so Prisma wiring stays in oRPC.
- **Validation** throws domain errors (`*ValidationError`, not-found, conflict) mapped to oRPC `BAD_REQUEST` / `NOT_FOUND` / `CONFLICT`.
- **List/get mappers** always add `cdnUrl: bucketCdnUrl(objectKey)`.
- Zod **input schemas** live next to types and are used as `.input(...)` on mutations.

List item shapes returned to clients always include resolved `cdnUrl` (see `PartnerLogoListItem`, `PromoVideoItem`, `MosaicTileListItem`).

---

## API surface (oRPC)

Router registration: `packages/orpc/src/router.ts` exports `partnerLogo`, `promoVideo`, `mosaic`.

Auth: `packages/orpc/src/middleware/auth.ts` — `authed = base.use(requireAuth)`. Public reads use plain `base`.

### Partner logos — `packages/orpc/src/procedures/partner-logo.ts`

| Procedure | Auth   | Path                          | Role                                      |
| --------- | ------ | ----------------------------- | ----------------------------------------- |
| `list`    | public | `GET /partner-logo/list`      | Website + Adminboard read                 |
| `create`  | authed | `POST /partner-logo/create`   | Add logo                                  |
| `update`  | authed | `POST /partner-logo/update`   | Edit fields                               |
| `reorder` | authed | `POST /partner-logo/reorder`  | Move up/down within category              |
| `remove`  | authed | `DELETE /partner-logo/remove` | Delete row; optional bucket object delete |

Prisma adapter implements `PartnerLogoStore` inline in the procedure file.

### Promo video — `packages/orpc/src/procedures/promo-video.ts`

| Procedure | Auth   | Path                        | Role                                              |
| --------- | ------ | --------------------------- | ------------------------------------------------- |
| `get`     | public | `GET /promo-video/get`      | Returns item or `null`                            |
| `assign`  | authed | `POST /promo-video/assign`  | Upsert singleton `objectKey` (must end `.mp4`)    |
| `clear`   | authed | `DELETE /promo-video/clear` | Deletes DB row only (does not delete bucket file) |

### Mosaic — `packages/orpc/src/procedures/mosaic.ts`

| Procedure | Auth   | Path                | Role                                                             |
| --------- | ------ | ------------------- | ---------------------------------------------------------------- |
| `get`     | public | `GET /mosaic/get`   | Board view: tiles + `eligibility`                                |
| `save`    | authed | `POST /mosaic/save` | Replace-all tiles; empty save needs `acknowledgeEmptyHide: true` |

Eligibility (`assessMosaicLiveEligibility`): `empty` \| `live` (full 3×3 coverage, no overlaps, legal spans) \| `incomplete` (with errors). Website shows only `live`.

---

## React Query client layer

Queries (public GETs):

- `packages/react-query/src/hooks/queries/partner-logo/use-partner-logos.ts` → `orpc.partnerLogo.list`
- `packages/react-query/src/hooks/queries/promo-video/use-promo-video.ts` → `orpc.promoVideo.get`
- `packages/react-query/src/hooks/queries/mosaic/use-mosaic.ts` → `orpc.mosaic.get`

Mutations invalidate the matching query key on success (e.g. `use-save-mosaic.ts`, `use-create-partner-logo.ts`, assign/clear promo video, partner logo update/reorder/remove).

Website wires the client in `apps/website/app/layout.tsx` via `ORPCProvider` + `QueryProvider` from `@virtality/react-query`.

---

## Adminboard CRUD / save / “publish”

Nav: `apps/adminboard/data/static/sidebar-nav.ts` — **Content** group:

- Partner logos → `/partner-logos`
- Promo video → `/promo-video`
- Mosaic → `/mosaic`

Pages (all `dynamic = 'force-dynamic'`):

- `apps/adminboard/app/partner-logos/page.tsx`
- `apps/adminboard/app/promo-video/page.tsx`
- `apps/adminboard/app/mosaic/page.tsx`

### Partner logos

- Dashboard: `apps/adminboard/components/partner-logos/partner-logos-dashboard.tsx`
- Explicit copy: **“publish immediately after save.”**
- CRUD via dialogs (add/edit/remove) + category lists with reorder; bucket object picker for `objectKey`.
- Helpers: `apps/adminboard/lib/partner-logos.ts`

### Promo video

- Dashboard: `apps/adminboard/components/promo-video/promo-video-dashboard.tsx`
- Copy: **“Changes go live immediately.”** Clearing hides the section without deleting the file.
- Assign / clear dialogs pick an MP4 bucket object.

### Mosaic

- Dashboard: `apps/adminboard/components/mosaic/mosaic-dashboard.tsx` (desktop gate on phone)
- Editor save path acknowledges empty hide (`acknowledgeEmptyHide`) via `mosaic-editor.tsx` / empty-save dialog.
- UI language says “publish on save,” but there is **no separate publish step** — `mosaic.save` is the write.
- Incomplete boards can exist in Adminboard preview; website only renders `eligibility.status === 'live'`.

**Shared publishing rule across all three:** no draft flag, no `publishedAt`. Persistence = live. Empty/cleared/non-live ⇒ website omits the section.

---

## Website fetch / render

Landing composition: `apps/website/app/page.tsx` mounts `MosaicSection` and `PromoVideo` (Supported by is mounted elsewhere in the page tree as its section).

| Section      | Consumer                                                         | Fetch               | Hide rule                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supported by | `apps/website/sections/supported-by/components/supported-by.tsx` | `usePartnerLogos()` | Maps via `partner-logo-adapter.ts`; uses `hasPartnerSection` / row visibility. **Press logos remain static** (`PRESS_LOGO_ITEMS` in section content) — not yet on this marketing API path. |
| Promo video  | `apps/website/sections/promo-video/promo-video.tsx`              | `usePromoVideo()`   | `null` while pending or missing `cdnUrl`                                                                                                                                                   |
| Mosaic       | `apps/website/sections/mosaic/components/mosaic-section.tsx`     | `useMosaic()`       | `shouldShowMosaicSection(eligibility)` requires `live` (`mosaic-visibility.ts`)                                                                                                            |

Website is a **client-side** consumer of the same public GETs Adminboard uses — not a separate BFF or server-component Prisma read for these tools.

Section docs pointer: `apps/website/CONTEXT.md` lists Mosaic and Promo video under section layout.

---

## Seeding / migration summary

| Tool          | Migration                                   | Seed                                                     |
| ------------- | ------------------------------------------- | -------------------------------------------------------- |
| Partner logos | `20260717120000_add_marketing_partner_logo` | None (empty until Admin adds)                            |
| Promo video   | `20260720120000_add_marketing_promo_video`  | Yes — singleton + default MP4 key for cutover continuity |
| Mosaic        | `20260720120000_add_marketing_mosaic`       | None (empty → hidden until live save)                    |

Product intent for managed logos was earlier sketched in `docs/prd/0139-adminboard-managed-marketing-content.md` (bucket object + CDN URL, Adminboard CRUD, public read). Shipped partner-logo / promo / mosaic code matches that storage model; press items from that PRD are **not** yet on the same API.

---

## Patterns Highlight Cards should mirror

1. **Prisma marketing model(s)** in `packages/db/prisma/models/` (e.g. collection + ordered cards, or two collections for Benefits / Features — same family as `MarketingPartnerLogo` multi-row, not a third-party CMS).
2. **Shared Zod types + store-port domain utils** in `@virtality/shared`; map to list items at read time (Highlight Cards need no `cdnUrl` unless they gain media — still keep mapping in shared utils).
3. **oRPC:** public `list`/`get` on `base`; create/update/reorder/remove (or replace-all save) on `authed`; register on `packages/orpc/src/router.ts`.
4. **React Query** query + mutation hooks with invalidate-on-success — same package used by website and Adminboard.
5. **Adminboard Content nav entry** + `app/.../page.tsx` + dashboard/dialogs; immediate-save = live (already locked on map #165).
6. **Website section** calls the public hook; **empty collection hides** that section’s card grid (same as empty partner rows / cleared promo / non-live mosaic).
7. **Optional cutover seed** in the Prisma migration if today’s hard-coded Benefits/Features lists must remain visible on deploy (promo-video pattern), otherwise empty-until-admin (partner-logo / mosaic pattern).
8. **Do not invent:** draft tables, separate website-only API, storing absolute image URLs, or a different transport than oRPC + react-query.

### Closest existing analogues for Highlight Cards

| Need                                          | Mirror                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordered editable list with add/remove/reorder | Partner logos (multi-row + `sortOrder` + reorder procedure)                                                                                  |
| Two placements sharing one tool               | Partner logos’ `category` split, or two mosaic-like singleton collections — product already wants one generic tool × two Content nav entries |
| Empty hides section                           | Promo clear / mosaic empty / partner empty rows                                                                                              |
| Seed from hard-coded lists                    | Promo video migration seed pattern                                                                                                           |

---

## Key file index

| Layer       | Paths                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma      | `packages/db/prisma/models/marketing-{partner-logo,promo-video,mosaic}.prisma`                                                            |
| Migrations  | `packages/db/prisma/migrations/20260717*` / `20260720*`                                                                                   |
| Shared      | `packages/shared/src/{types,utils}/{partner-logo,promo-video,mosaic}.*`                                                                   |
| oRPC        | `packages/orpc/src/procedures/{partner-logo,promo-video,mosaic}.ts`, `router.ts`                                                          |
| React Query | `packages/react-query/src/hooks/{queries,mutations}/{partner-logo,promo-video,mosaic}/`                                                   |
| Adminboard  | `apps/adminboard/app/{partner-logos,promo-video,mosaic}/`, `components/{partner-logos,promo-video,mosaic}/`, `data/static/sidebar-nav.ts` |
| Website     | `apps/website/sections/{supported-by,promo-video,mosaic}/`, `app/layout.tsx`, `app/page.tsx`                                              |
