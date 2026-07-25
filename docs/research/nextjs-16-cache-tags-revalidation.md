# Research: Next.js 16 cache tags and on-demand revalidation

**Ticket:** [Research Next.js 16 cache tags and on-demand revalidation for App Router](https://github.com/Steliospne/virtality-platform/issues/191)  
**Map:** [Website marketing content cache — way to implementation-ready route](https://github.com/Steliospne/virtality-platform/issues/190)  
**Question:** For Next.js **16.1.6** App Router (`apps/website`), which first-party cache primitives should we use to (1) tag cached marketing data fetches and (2) bust those tags from an external HTTP call (API server → website Route Handler)?  
**Sources:** Next.js primary docs (v16 App Router) and the Next.js 16 release blog.  
**Branch:** `research/nextjs-16-cache-tags-revalidation`

**Locked map context (not re-decided here):** React Query stays via prefetch + hydrate; Next tags wrap the server-side cached fetch; no time-based ISR fallback; shared-secret auth on the revalidate endpoint; tags conceptually `partner-logos`, `mosaic`, `promo-video`, and highlight cards per collection.

## Verdict

Use **tag-based on-demand revalidation**, not path-based as the primary bust mechanism.

1. **Tag the cached marketing reads** with first-party tags that match the map’s domain names.
2. **Bust from a website Route Handler** with `revalidateTag`, called by the API server over HTTP after successful marketing writes.
3. **Authenticate that handler** with a shared secret (env var), following the official Pages on-demand ISR and App Router Draft Mode secret patterns — App Router’s `revalidateTag` Route Handler example itself shows no auth.

**Which tagging API depends on whether `cacheComponents` is enabled** (it is **not** on today in `apps/website/next.config.ts`):

| Mode                                                       | Tag cached data with                                                                       | Lifetime without time ISR                                                                   | Bust from Route Handler                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Previous model** (current website: no `cacheComponents`) | `fetch(..., { next: { tags } })` and/or `unstable_cache(..., { tags, revalidate: false })` | `next.revalidate: false` / `unstable_cache` `revalidate: false` = cache until tag/path bust | `revalidateTag(tag, …)`                                                     |
| **Cache Components** (`cacheComponents: true`)             | `'use cache'` + `cacheTag(...)` (+ optional `cacheLife`)                                   | Prefer long profile / CMS guidance; presets still encode time (`max` = 30d revalidate)      | Same: `revalidateTag` in Route Handler (`updateTag` is Server Actions only) |

For this map’s locked “tag bust only” preference under **16.1.6 without enabling Cache Components**, the cleanest first-party fit is: **`next.tags` on `fetch` and/or `unstable_cache` with `revalidate: false`**, then **`revalidateTag(tag, { expire: 0 })`** in a secret-gated Route Handler (docs’ webhook / external-caller pattern for immediate expiration). Prefer tags over `revalidatePath` for the marketing collections.

---

## Primary sources

| Source                                                                                                                               | Role                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [Next.js 16 blog — Improved Caching APIs](https://nextjs.org/blog/next-16#improved-caching-apis)                                     | `revalidateTag` two-arg / `updateTag` introduced in Next 16    |
| [`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)                                 | Flag required for `'use cache'` / `cacheTag` / `cacheLife`     |
| [`'use cache'`](https://nextjs.org/docs/app/api-reference/directives/use-cache)                                                      | Cache Components caching directive                             |
| [`cacheTag`](https://nextjs.org/docs/app/api-reference/functions/cacheTag)                                                           | Tag entries inside `'use cache'`                               |
| [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)                                                         | Time profiles for `'use cache'`                                |
| [`fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch)                                                                 | `next.tags`, `next.revalidate`, `cache`                        |
| [Caching (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components)                                      | Tagging + on-demand without Cache Components                   |
| [`unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)                                               | Non-`fetch` cache + tags; `revalidate: false` = until tag bust |
| [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)                                                 | Route Handler / Server Action tag invalidation                 |
| [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)                                                         | Immediate expire; **Server Actions only**                      |
| [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)                                               | Path invalidation; complementary to tags                       |
| [Revalidating (Cache Components)](https://nextjs.org/docs/app/getting-started/revalidating)                                          | CMS guidance: long duration + `revalidateTag`                  |
| [ISR (App)](https://nextjs.org/docs/app/guides/incremental-static-regeneration)                                                      | On-demand `revalidateTag` / `revalidatePath` examples          |
| [ISR (Pages) — secret](https://nextjs.org/docs/pages/guides/incremental-static-regeneration#on-demand-validation-with-resrevalidate) | Shared-secret query param for revalidate API                   |
| [Draft Mode — secret](https://nextjs.org/docs/app/guides/draft-mode)                                                                 | App Router shared-secret Route Handler pattern                 |
| [Authentication — Route Handlers](https://nextjs.org/docs/app/guides/authentication)                                                 | Treat Route Handlers as public API endpoints                   |
| [revalidateTag single-arg deprecation](https://nextjs.org/docs/messages/revalidate-tag-single-arg)                                   | Webhook Route Handler → `{ expire: 0 }`                        |

Repo fact: `apps/website` depends on `next@16.1.6` and does **not** set `cacheComponents: true` today.

---

## Two caching models in Next 16

Next 16 ships **Cache Components** behind `cacheComponents: true` ([blog](https://nextjs.org/blog/next-16#cache-components), [config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)). That unlocks `'use cache'`, `cacheTag`, and `cacheLife`. Without the flag, use the [previous caching model](https://nextjs.org/docs/app/guides/caching-without-cache-components): extended `fetch` options, route segment `revalidate`, and `unstable_cache`.

Both models share **`revalidateTag` / `revalidatePath` in Server Actions and Route Handlers** for on-demand busts.

Enabling Cache Components is a broader product/architecture choice (PPR default, dynamic-by-default data fetching). This ticket only answers which primitives tag and bust marketing reads — it does **not** decide to flip `cacheComponents`.

---

## (1) Tagging cached marketing data fetches

### A. Previous model — `fetch` tags (when the read is a `fetch`)

From [`fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch) and [Caching (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components):

```ts
await fetch(url, {
  next: {
    tags: ['partner-logos'],
    revalidate: false, // indefinitely until on-demand bust
  },
})
```

- `next.tags`: associate cache entries with tags (max 256 chars/tag, max 128 tags).
- `next.revalidate: false`: cache indefinitely (semantically `Infinity`). Matches the map’s “no time-based ISR fallback.”
- `cache: 'force-cache'` is the explicit “use the Data Cache” option; tagging is orthogonal via `next.tags`.

Same tagging pattern appears in the [App ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration#on-demand-revalidation-with-revalidatetag).

### B. Previous model — non-`fetch` (oRPC / store wrappers)

If the server prefetch does not go through Next’s extended `fetch` (typical for RPC clients), docs point to [`unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache):

```ts
import { unstable_cache } from 'next/cache'

const getPartnerLogosCached = unstable_cache(
  async () => /* call public marketing read */,
  ['partner-logos'],
  { tags: ['partner-logos'], revalidate: false },
)
```

Docs: omit `revalidate` or pass `false` to cache **indefinitely until** matching `revalidateTag` / `revalidatePath`. Next 16 docs mark `unstable_cache` as replaced by `'use cache'` when using Cache Components, but it remains the documented previous-model tool for non-`fetch` tagged cache.

### C. Cache Components — `'use cache'` + `cacheTag` (+ `cacheLife`)

Requires `cacheComponents: true`. Inside a cached function ([`cacheTag`](https://nextjs.org/docs/app/api-reference/functions/cacheTag)):

```ts
import { cacheTag, cacheLife } from 'next/cache'

export async function getPartnerLogos() {
  'use cache'
  cacheTag('partner-logos')
  cacheLife('max') // or a custom long-lived profile
  return /* marketing read */
}
```

- Multiple tags: `cacheTag('tag-one', 'tag-two')` (up to 128 per call).
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife) sets time profiles (`stale` / `revalidate` / `expire`). Presets all include time-based `revalidate` (e.g. `max`: 30 days revalidate, 1 year expire). Omitting `cacheLife` uses `default` (15 minutes revalidate).
- Official [revalidating](https://nextjs.org/docs/app/getting-started/revalidating) guidance for CMS-like content: **use tags with longer cache durations and rely on `revalidateTag`**, rather than short time expiry. That aligns with the map’s intent, but **Cache Components presets are not “tag-only forever”** the way `revalidate: false` is in the previous model — approximate with `max` or a custom profile with a very long `revalidate` / `expire`.

### Tag names (map-locked concepts)

Apply one tag per marketing collection, e.g. `partner-logos`, `mosaic`, `promo-video`, and highlight-card tags **per collection** (e.g. `highlight-cards-benefits` / `highlight-cards-features`). Same string must be used in `cacheTag` / `next.tags` / `unstable_cache.tags` and later in `revalidateTag`.

---

## (2) Busting tags from an external HTTP call

### Primitive: `revalidateTag` in a Route Handler

[`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) works in **Server Functions and Route Handlers** (not Client Components / Proxy). Official Route Handler sketch:

```ts
import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')
  if (tag) {
    revalidateTag(tag, 'max')
    return Response.json({ revalidated: true, now: Date.now() })
  }
  return Response.json({
    revalidated: false,
    message: 'Missing tag to revalidate',
  })
}
```

**Two-argument form is required in Next 16** ([blog](https://nextjs.org/blog/next-16#improved-caching-apis), [deprecation message](https://nextjs.org/docs/messages/revalidate-tag-single-arg)):

| Call                                | Behavior                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `revalidateTag(tag, 'max')`         | Mark stale; next visit uses **stale-while-revalidate** (recommended default)                                                             |
| `revalidateTag(tag, { expire: 0 })` | **Immediate expire**; next read is a blocking cache miss — docs’ pattern for **webhooks / third-party / external Route Handler callers** |
| `revalidateTag(tag)` (one arg)      | Deprecated                                                                                                                               |

For API server → website after Adminboard-driven writes, **`{ expire: 0 }`** is the documented external-caller fit when you want the next visitor to wait for fresh data rather than briefly seeing stale marketing content.

### Do not use `updateTag` on this endpoint

[`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag) is **Server Actions only**. Calling it from a Route Handler errors. External HTTP busts must use `revalidateTag`.

### `revalidatePath` — secondary

[`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) invalidates a path (or layout subtree), not a data tag. Docs note pages sharing the same fetch tag can diverge if only one path is revalidated. Prefer **`revalidateTag` for marketing collections**; optionally combine with path bust as a manual escape hatch. Docs prefer tag-based over path-based when possible ([Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)).

### Auth / secret patterns in official docs

The App Router `revalidateTag` Route Handler example does **not** include auth. Official shared-secret patterns elsewhere:

1. **Pages Router on-demand ISR** — compare query `secret` to `process.env.MY_SECRET_TOKEN`, return 401 on mismatch ([Pages ISR](https://nextjs.org/docs/pages/guides/incremental-static-regeneration#on-demand-validation-with-resrevalidate)).
2. **App Router Draft Mode** — shared secret between Next app and CMS; reject with 401 if `secret` mismatches ([Draft Mode](https://nextjs.org/docs/app/guides/draft-mode)).
3. **Authentication guide** — treat Route Handlers like public API endpoints and verify the caller is allowed ([Authentication](https://nextjs.org/docs/app/guides/authentication)).
4. **Deprecation message** for Route Handler webhooks — “Validate the incoming request headers and other parameters” before `revalidateTag(tag, { expire: 0 })` ([message](https://nextjs.org/docs/messages/revalidate-tag-single-arg)).

**Implication for the locked shared-secret preference:** gate the website revalidate Route Handler the same way (env secret on website + API server; reject unauthorized requests). Prefer a header or POST body over putting the secret only in query strings for logs/referrer hygiene — docs examples often use `?secret=`, which is still the first-party illustrated pattern.

---

## Recommended shape for this map (research conclusion)

Without inventing implementation, the first-party stack that matches the locked decisions on **Next 16.1.6 / current website config**:

1. **Tag:** In the website server prefetch path that feeds React Query dehydrate, wrap each marketing read with Next Data Cache tags — `fetch` + `next: { tags, revalidate: false }` when applicable, else `unstable_cache(..., { tags, revalidate: false })`. Tag strings = map domain tags.
2. **Bust:** Website Route Handler calls `revalidateTag(tag, { expire: 0 })` (and optionally multiple tags / an “all marketing” ops mode).
3. **Auth:** Shared secret env check before calling `revalidateTag` (Pages ISR / Draft Mode pattern + Route Handler security guidance).
4. **Defer** enabling `cacheComponents` + `'use cache'` / `cacheTag` / `cacheLife` unless the route deliberately adopts Cache Components; if adopted later, retag with `cacheTag` and keep the same `revalidateTag` Route Handler contract.

`revalidatePath` remains available as a coarse manual escape hatch, not the primary per-collection bust.

---

## Out of scope (this ticket)

- Implementing the Route Handler, server caller helper, or website prefetch wrappers.
- Choosing whether to enable `cacheComponents` on the website.
- React Query `staleTime` wiring (covered by other map tickets / locked preferences).
