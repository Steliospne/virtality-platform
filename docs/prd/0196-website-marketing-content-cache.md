# PRD: Website marketing content cache (ISR tags + React Query)

**Map:** [Website marketing content cache — way to implementation-ready route](https://github.com/Steliospne/virtality-platform/issues/190)

**Handoff ticket:** [Assemble website marketing cache implementation handoff](https://github.com/Steliospne/virtality-platform/issues/196)

**Status:** Ready for implementers / AFK agents

**Domains:** `apps/website`, `services/server` / `packages/orpc`, `@virtality/react-query`

**Research (bring into the same PR / branch as needed):**

- [`docs/research/tanstack-query-next-ssr-tagged-fetches.md`](../research/tanstack-query-next-ssr-tagged-fetches.md) — [Research TanStack Query v5 SSR with Next.js for tagged marketing fetches](https://github.com/Steliospne/virtality-platform/issues/192)
- [`docs/research/nextjs-16-cache-tags-revalidation.md`](../research/nextjs-16-cache-tags-revalidation.md) — [Research Next.js 16 cache tags and on-demand revalidation for App Router](https://github.com/Steliospne/virtality-platform/issues/191)

---

## Problem

The public website loads Adminboard-managed marketing content (partner logos, mosaic, promo video, highlight cards) via **client React Query** on every visit. That causes per-visitor API/server invocations and slower first paint (skeletons / delayed sections).

## Goal

Serve those four domains from **Next.js Data Cache** (tagged, no time-based ISR) under a **server prefetch → dehydrate → `HydrationBoundary`** path, keeping existing client hooks with website-only `staleTime: 'static'`. After Adminboard writes, the **API server** busts the matching website cache tag(s) via a secret-gated Route Handler. Map destination is met when this handoff exists — **shipping code is the next effort**.

## In scope

| Domain          | Public read                        | Cache tag                                              |
| --------------- | ---------------------------------- | ------------------------------------------------------ |
| Partner logos   | `partnerLogo.list`                 | `partner-logos`                                        |
| Mosaic          | `mosaic.get`                       | `mosaic`                                               |
| Promo video     | `promoVideo.get`                   | `promo-video`                                          |
| Highlight cards | `highlightCard.list` by collection | `highlight-cards-benefits`, `highlight-cards-features` |

Highlight-card tag formula: `` `highlight-cards-${collection}` `` for `'benefits' | 'features'`.

## Out of scope

- Time-based ISR as the primary freshness mechanism
- Dropping React Query for props-only RSC
- Caching waitlist, blog, press static arrays, or other non-Adminboard reads
- Busting from the Adminboard browser
- CDN/edge caching of public oRPC GETs as the main strategy
- Changing Adminboard shared-hook `staleTime` defaults
- Enabling Next `cacheComponents` / `'use cache'` (defer unless a later change adopts it)

---

## Locked architecture

### End-to-end flow

```text
Visitor → home RSC
  → await prefetchQuery × 4 domains (tagged queryFn → Next Data Cache)
  → dehydrate → HydrationBoundary → existing client sections
  → website-only staleTime: 'static' (no client refetch)

Adminboard save → oRPC authed mutation succeeds
  → services/server helper POSTs website /api/revalidate (Bearer secret)
  → revalidateTag(tag, { expire: 0 })
  → next visitor’s prefetch is a cache miss → fresh dehydrate

If revalidate HTTP fails: mutation still succeeded; log failure (content may stay stale until next successful bust or ops `all: true`)
```

### Website prefetch / hydrate topology

From [Pin website prefetch and HydrationBoundary topology for marketing content](https://github.com/Steliospne/virtality-platform/issues/194):

1. Prefetch only in `apps/website/app/page.tsx` (not root layout, not per-section server wrappers).
2. `HydrationBoundary` wraps only the home section tree in that page; root layout keeps `QueryProvider` → `ORPCProvider` → chrome → `{children}`.
3. Website-local helpers apply `staleTime: 'static'` to **both** prefetch options and client reads (options factory shared by both). Shared `@virtality/react-query` marketing hooks stay at package defaults for Adminboard.
4. Tagged server `queryFn`s live in a **website-only** module (e.g. `apps/website/lib/marketing-prefetch.ts`). Use shared `getQueryClient()` (superjson) — not Adminboard’s local non-superjson client.
5. **`await`** all four domain prefetches before rendering the Boundary (section skeletons remain as failure fallback).

### Next cache primitives (current website: no Cache Components)

From research #191 / #192:

- Prefer `unstable_cache(..., { tags: [domainTag], revalidate: false })` around the server oRPC/read used by prefetch `queryFn`, and/or tagged `fetch` with `force-cache` + `next.tags` + `revalidate: false` when the read is plain GET `fetch`.
- Do **not** rely on React Query’s server cache for cross-visitor sharing.
- Bust with `revalidateTag(tag, { expire: 0 })` from a Route Handler (not `updateTag` — Server Actions only).

### Revalidate HTTP contract

From [Pin marketing cache tag vocabulary and revalidate HTTP contract](https://github.com/Steliospne/virtality-platform/issues/193):

| Piece         | Lock                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Method / path | `POST /api/revalidate` on the website                                                                 |
| Auth          | `Authorization: Bearer <REVALIDATE_SECRET>` — `401` `{ "error": "Unauthorized" }` on missing/mismatch |
| Body (XOR)    | `{ "tag": "<allowlisted tag>" }` **or** `{ "all": true }` — not both, not neither                     |
| Allowlist     | `partner-logos`, `mosaic`, `promo-video`, `highlight-cards-benefits`, `highlight-cards-features`      |
| `all: true`   | Expand to all five allowlisted tags, then bust each                                                   |
| Bust          | `revalidateTag(tag, { expire: 0 })` per resolved tag                                                  |
| `200`         | `{ "revalidated": true, "tags": ["…"] }` — tags actually busted                                       |
| `400`         | Non-JSON, both/`neither` fields, or unknown `tag`                                                     |
| `500`         | Only if `revalidateTag` throws                                                                        |

No query-string secret/tag; no GET; no umbrella dual-tag on reads.

**Fail closed:** if `REVALIDATE_SECRET` is unset on the website, reject revalidate requests (`401`) — do not leave the route open (unlike optional `CAL_WEBHOOK_SECRET`).

### API server caller

From map Notes + [Inventory REVALIDATE_SECRET env wiring across website and API server](https://github.com/Steliospne/virtality-platform/issues/195):

- Helper lives in **`services/server`** (not a shared package; not Adminboard browser).
- After **successful** marketing mutation, `POST ${getWebsiteUrl()}/api/revalidate` with Bearer secret and the domain body.
- `getWebsiteUrl()` needs correct **`NEXT_PUBLIC_ENV`** on the server (`development` → `http://localhost:3000`, `preview` → `https://preview-web.virtality.app`, `production` → `https://virtality.app`).
- On HTTP/network failure: **log** (structured logger); **do not** fail the mutation.
- Ops escape hatch: same endpoint with `{ "all": true }` (or a single allowlisted `tag`) using the same secret (curl / runbook).

### Mutation → tag map

| oRPC mutations (authed)                                  | Tag to bust                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `partnerLogo.create` / `update` / `reorder` / `remove`   | `partner-logos`                                             |
| `mosaic.save`                                            | `mosaic`                                                    |
| `promoVideo.assign` / `clear`                            | `promo-video`                                               |
| `highlightCard.create` / `update` / `reorder` / `remove` | `highlight-cards-${collection}` for the affected collection |

Implementers: for update/reorder/remove, resolve `collection` from input or loaded record before busting.

### Env / secrets

| Key                 | Where                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `REVALIDATE_SECRET` | Same value on `apps/website` **and** `services/server` (local `.env` + staging/prod hosts) |
| `NEXT_PUBLIC_ENV`   | Server must set this so `getWebsiteUrl()` targets the right website                        |

Also add `REVALIDATE_SECRET` to `turbo.json` `@virtality/website#build` and `@virtality/server#build` `env` arrays. Optional: empty-value `.env.example` stubs. Full checklist is on [Inventory REVALIDATE_SECRET…](https://github.com/Steliospne/virtality-platform/issues/195).

---

## Suggested implementation slices (soft default)

Not a locked grilling answer — preferred order for the build effort:

1. **Website:** `POST /api/revalidate` + `marketing-prefetch` tagged `queryFn`s + home `page.tsx` prefetch / `HydrationBoundary` / website-only `staleTime: 'static'` wiring.
2. **API server:** revalidate helper + call sites on marketing mutations (best-effort log-on-failure).
3. **Env:** provision `REVALIDATE_SECRET` (+ server `NEXT_PUBLIC_ENV`) local → staging → prod; turbo env lists.

Website-first lets you verify tag bust against a real Route Handler before wiring callers.

## ADR (soft default)

**No new ADR required** for this effort. Decision record = this PRD + the two research notes + closed map tickets. Revisit only if implementers diverge from tagged Data Cache + Bearer revalidate in a surprising, hard-to-reverse way.

---

## Acceptance checklist (for the build PR)

- [ ] Home visit with warm cache does not hit origin for the four marketing reads (Next Data Cache hit).
- [ ] Home HTML/hydration includes marketing query data (no client waterfall for those keys when prefetch succeeds).
- [ ] Client does not refetch those queries on mount (`staleTime: 'static'` website-only; Adminboard unchanged).
- [ ] After each marketing mutation class, the matching tag busts; next home load shows fresh content.
- [ ] `{ "all": true }` with Bearer secret busts all five tags.
- [ ] Bad/missing Bearer → `401`; unknown tag / bad body → `400`.
- [ ] Revalidate failure after DB write does not roll back / fail the mutation; failure is logged.
- [ ] `REVALIDATE_SECRET` documented in turbo env; staging/prod checklist followed.

## Test expectations

- Unit: revalidate route auth + body XOR + allowlist expansion.
- Unit: marketing tag string helpers (`highlight-cards-${collection}`).
- Integration / smoke: prefetch options share keys with client hooks; server caller posts expected body per mutation (mock `fetch`).
- Manual: Adminboard edit → reload website → content updates without redeploy.
