import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from '@tanstack/react-query'
import superjson from 'superjson'

const staleTime = 60 * 1000

/**
 * Create a QueryClient with Virtality defaults (staleTime, superjson serialization, SSR-friendly dehydrate/hydrate).
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
      hydrate: { deserializeData: superjson.deserialize },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * Returns a QueryClient (per-request on server, singleton in browser).
 * Safe to call from Server Components for prefetch — this module is not a Client Component.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
