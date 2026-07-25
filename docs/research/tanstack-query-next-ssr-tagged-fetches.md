# Research: TanStack Query v5 SSR + Next tagged fetches (website marketing)

**Ticket:** [Research TanStack Query v5 SSR with Next.js for tagged marketing fetches](https://github.com/Steliospne/virtality-platform/issues/192)  
**Map:** [Website marketing content cache — way to implementation-ready route](https://github.com/Steliospne/virtality-platform/issues/190)  
**Question:** Given TanStack Query **v5.90** and Next.js App Router, what is the official recommended pattern to server-prefetch queries, dehydrate/hydrate via `HydrationBoundary`, and combine that with Next’s cached/tagged server fetches so visitors do not each hit the API — while keeping client hooks and website-only `staleTime: 'static'` until a tag bust?  
**Sources:** TanStack Query v5 primary docs; Next.js App Router primary docs; in-repo provider + Adminboard precedent.  
**Branch:** `research/tanstack-query-next-ssr-tagged-fetches`  
**Stack facts:** `@tanstack/react-query` `5.90.20` (shared package); website Next `16.1.6`; website does **not** set `cacheComponents: true`.

## Verdict

The official App Router pattern is:

1. **Server Component** creates a per-request `QueryClient`, **`prefetchQuery`s** with the same `queryKey`s the client hooks use, then wraps children in **`HydrationBoundary`** with `dehydrate(queryClient)`.
2. **Client Components** keep calling **`useQuery` / existing hooks** — no props-only RSC rewrite.
3. Set **`staleTime` high enough** that hydration does not immediately refetch on the client. For marketing that must not refetch until the page is rebuilt with fresh dehydrated state, **`staleTime: 'static'`** is the documented “never refetch, even after `invalidateQueries`” option — so freshness comes from **Next cache tag bust → next render’s server prefetch**, not from client invalidation.
4. **TanStack Query’s cache does not share across visitors.** To stop each visitor from hitting the API, the **server `queryFn`** (or the function it calls) must go through **Next’s Data Cache**: tagged `fetch` (`cache: 'force-cache'` + `next.tags`) and/or **`unstable_cache` / `'use cache'` + `cacheTag`**, then bust with **`revalidateTag`** from a Route Handler (map: API server → website revalidate route).

This matches Adminboard’s prefetch + `HydrationBoundary` **shape**, but Adminboard’s `queryFn`s are uncached Prisma reads for one editor session — website marketing needs the **extra Next tagged cache layer** under those `queryFn`s. Prefer the shared `@virtality/react-query` `getQueryClient` on the website so **superjson dehydrate/hydrate** stays paired; do not copy Adminboard’s local non-superjson client for website prefetch.

---

## Primary sources

| Source                                                                                                  | Role                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [Advanced Server Rendering](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)     | App Router: `getQueryClient`, prefetch, `HydrationBoundary`, pending dehydrate, serialize/deserialize, Server Action anti-pattern for `queryFn` |
| [Server Rendering & Hydration](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)           | Prefetch → dehydrate → hydrate basics; `staleTime > 0` on SSR                                                                                   |
| [Important Defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)      | `staleTime: 'static'` vs `Infinity`                                                                                                             |
| [Next.js `fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch)                            | `cache`, `next.revalidate`, `next.tags`                                                                                                         |
| [Caching without Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components) | `force-cache`, tagged fetch, `unstable_cache`, `revalidateTag` (website today: no `cacheComponents`)                                            |
| [unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)                    | Tag + indefinite cache (`revalidate: false`) for non-`fetch` / opaque clients                                                                   |
| [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)                      | On-demand bust from Route Handlers; Route Handler example                                                                                       |
| [cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)      | Opt-in `'use cache'` + `cacheTag` path (not enabled on website)                                                                                 |

---

## Official TanStack pattern (App Router)

### Provider / `getQueryClient`

From Advanced SSR:

- **Server:** always `new QueryClient()` per request (no shared cache across users).
- **Browser:** module singleton so React suspend does not remake the client.
- Default **`staleTime` above `0`** so hydrated data is not refetch-stormed on mount (docs example: `60 * 1000`).
- For streaming without awaiting every prefetch: dehydrate **pending** queries (`defaultShouldDehydrateQuery` **or** `status === 'pending'`), and **`shouldRedactErrors: () => false`** so Next can detect dynamic pages from thrown errors.
- Optional **`dehydrate.serializeData` / `hydrate.deserializeData`** when data is not plain JSON.

Treat Server Components as a **prefetch-only** phase: do not also render the same query’s result in a Server Component if the client owns revalidation of that data (data-ownership section in Advanced SSR). Prefer `prefetchQuery` over `fetchQuery` unless you need errors; if you `fetchQuery`, do not render that result on the server beside a client consumer of the same key.

**Do not** use Next **Server Actions as `queryFn`** for reads — TanStack documents that client-called Server Actions run serially and can hang pending queries; use `fetch` / RPC for client fetches; Server Actions stay for mutations.

### Prefetch → dehydrate → hydrate

Canonical App Router sketch (docs):

```tsx
// Server Component (page / section boundary)
const queryClient = getQueryClient()
queryClient.prefetchQuery({ queryKey: ['…'], queryFn: getCached… })
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ClientTree />
  </HydrationBoundary>
)
```

Client keeps `useQuery({ queryKey, queryFn })` (or shared hooks) with the **same keys**. Un-prefetched queries still work; they just fetch on the client.

Awaiting prefetch blocks that Suspense boundary until ready; not awaiting + pending dehydrate streams data (v5.40+). Both are official.

---

## Official Next pattern (shared cache across visitors)

React Query’s server cache dies with the request. Cross-visitor reuse is **Next’s** job:

| Mechanism                                                     | When                                                                              | Tag bust                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| `fetch(url, { cache: 'force-cache', next: { tags: ['…'] } })` | Server `queryFn` can call Next-extended `fetch` (GET marketing oRPC routes exist) | `revalidateTag(tag, …)` in a Route Handler |
| `unstable_cache(fn, keyParts, { tags, revalidate: false })`   | Opaque client / non-`fetch` body; cache until tag bust (map: no time-based ISR)   | Same                                       |
| `'use cache'` + `cacheTag`                                    | Only if `cacheComponents: true`                                                   | `revalidateTag` / `updateTag`              |

Website `next.config.ts` does **not** enable `cacheComponents`, so the **stable path today** is tagged **`fetch` + `force-cache`** and/or **`unstable_cache` with `revalidate: false`**, plus a **revalidate Route Handler** (Next docs show `revalidateTag` from `app/api/revalidate/route.ts`). Map already locks API-server → website revalidate (shared secret), not Adminboard browser.

Default Next `fetch` is **not** cached across requests until you opt in (`force-cache` / tags / `unstable_cache`). Memoization of identical `fetch` within **one** render pass is separate from the persistent Data Cache.

---

## Combining the two (recommended composition)

```text
Visitor request
  → RSC prefetchQuery(queryKey, queryFn)
       → queryFn hits Next Data Cache (tagged fetch / unstable_cache)
            → miss: one origin oRPC GET; hit: no API
  → dehydrate → HydrationBoundary
  → client hooks (same keys) + staleTime: 'static'
       → no client refetch / no invalidateQueries refresh
  → Adminboard save → API server → website revalidateTag(domain tag)
       → next visitor’s RSC prefetch sees miss → fresh dehydrate
```

Two clocks:

1. **Next Data Cache** — shared; busted by tags (`partner-logos`, `mosaic`, `promo-video`, highlight cards per collection).
2. **React Query client cache** — per browser tab; with `'static'`, stays until full remount with new dehydrated state (new navigation / reload after Next has fresh data).

`staleTime: 'static'` (Important Defaults): never considered stale; **`invalidateQueries` has no effect**; `refetchOnMount` / focus / reconnect `"always"` also blocked. That matches “until a tag bust” **only if** the next paint is driven by **server prefetch after revalidation**, not by client invalidation. If a future need required client-side invalidation after bust, use `Infinity` instead — map currently locks `'static'`.

---

## Map to this repo

### Shared `@virtality/react-query` provider

`packages/react-query/src/provider.tsx` already follows Advanced SSR:

- Per-request server / singleton browser `getQueryClient`
- Default `staleTime: 60_000`
- Pending dehydrate + `shouldRedactErrors: () => false`
- **`serializeData: superjson.serialize` / `deserializeData: superjson.deserialize`**

Website layout already wraps `QueryProvider` + `ORPCProvider`. Marketing sections today call client hooks only (`usePartnerLogos`, `useMosaic`, `usePromoVideo`) with **no** SSR prefetch and **no** Next tags — every visitor can hit the API after hydrate (and again when the 60s default goes stale).

### Adminboard precedent

| Piece           | Adminboard                                                                                 | Website marketing target                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Prefetch in RSC | `app/resources/preset/[id]/page.tsx` — `getQueryClient()` + `prefetchQuery` (no await)     | Same shape                                                                                   |
| Boundary        | `components/shared/hydration-boundary.tsx` — `HydrationBoundary state={dehydrate(client)}` | Same; may reuse pattern or inline                                                            |
| Query client    | **Local** `apps/adminboard/react-query.ts` — **no superjson**                              | Use **shared** `getQueryClient` so dehydrate matches provider hydrate                        |
| `queryFn`       | Prisma via `'use server'` data helpers (uncached across visitors)                          | Tagged Next-cached public GET / `unstable_cache` around oRPC                                 |
| `staleTime`     | Shared Adminboard default 60s                                                              | Website-only `'static'` on marketing queries; **do not** change Adminboard / package default |

Adminboard already uses the **streaming-friendly** “prefetch without await + pending dehydrate” path. Website can copy that **orchestration**, not the uncached Prisma `queryFn`.

### Conflicts / pitfalls to watch

1. **Two `getQueryClient` implementations** — Adminboard local vs shared package. Website prefetch **must** use the shared one (superjson). Dehydrating with one serializer and hydrating with another breaks cache restore.
2. **`ORPCProvider` / `useORPC` are client-context** — RSC prefetch cannot call the hooks. Server `queryFn` needs a server-callable path (plain `fetch` to the public GET routes, or a server oRPC client) whose **query keys match** `orpc.*.*.queryOptions()` so hydration lands in the same cache entries the hooks read.
3. **Package default `staleTime: 60s`** — website-only `'static'` belongs on marketing `queryOptions` / website wrappers, not on the shared provider default (Adminboard unchanged).
4. **`'static'` vs tag bust** — client `invalidateQueries` after revalidate will **not** refresh marketing queries; rely on Next remount / new dehydrated payload.
5. **Server Actions as `queryFn`** — Adminboard’s `'use server'` data modules are used as prefetch `queryFn`s today; TanStack warns against that pattern for **client** refetch. Prefer keeping website marketing `queryFn`s as `fetch`/RPC (and mutations as Server Actions / oRPC mutations elsewhere).
6. **Next rewrites** — website rewrites PostHog paths; TanStack SSR guide notes rewrites can interact badly with static optimization / double hydration in Pages Router. Low risk for App Router marketing prefetch, but avoid putting marketing GETs behind rewrite edge cases.
7. **`cacheComponents`** — not on; don’t require `'use cache'` for v1. `unstable_cache` docs note replacement by `'use cache'` when Cache Components are adopted later.
8. **TanStack “you might not need React Query”** for greenfield RSC — map explicitly keeps RQ + hydration; that is a product lock, not a conflict with the official prefetch guide (which exists for exactly this migration/keep-hooks case).

---

## Concrete recommendation for the four domains

For partner logos, mosaic, promo video, and highlight cards (per collection):

1. Add **server helpers** that load via **tagged Next cache** (`force-cache` + `next.tags`, or `unstable_cache(..., { tags, revalidate: false })`) using map tags: `partner-logos`, `mosaic`, `promo-video`, and per-collection highlight tags.
2. In the landing (or section) **Server Component**, `getQueryClient()` from `@virtality/react-query`, **`prefetchQuery`** each domain with keys identical to the existing oRPC query options, wrap section trees in **`HydrationBoundary`**.
3. Keep existing client section hooks; set **`staleTime: 'static'`** only on those website marketing reads.
4. Implement website **`revalidateTag` Route Handler** (secret-gated); API server calls it after successful marketing writes (map). After bust, the next SSR prefetch fills RQ again.

No need to switch to props-only RSC or to change Adminboard defaults.

---

## Key file index (repo)

| Piece                        | Path                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Shared RQ provider           | `packages/react-query/src/provider.tsx`                                            |
| Website providers            | `apps/website/app/layout.tsx`                                                      |
| Marketing hooks (no SSR yet) | `packages/react-query/src/hooks/queries/{partner-logo,mosaic,promo-video}/`        |
| Adminboard `getQueryClient`  | `apps/adminboard/react-query.ts`                                                   |
| Adminboard Boundary          | `apps/adminboard/components/shared/hydration-boundary.tsx`                         |
| Adminboard prefetch page     | `apps/adminboard/app/resources/preset/[id]/page.tsx`                               |
| Public GET routes            | `packages/orpc/src/procedures/{partner-logo,mosaic,promo-video,highlight-card}.ts` |
| Website Next config          | `apps/website/next.config.ts`                                                      |
