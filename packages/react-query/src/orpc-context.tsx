'use client'

import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createORPCClient } from '@virtality/orpc/client'
import type { ORPCClientLink } from '@virtality/orpc/client'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { configureORPC } from './orpc.js'
import type { ORPCUtils } from './orpc.js'

const ORPCContext = createContext<ORPCUtils | null>(null)

export interface ORPCProviderProps {
  /**
   * API base URL (e.g. process.env.NEXT_PUBLIC_SERVER_URL + ORPC_PREFIX).
   * Use this from Server Components / layout; the link is built inside the client (no functions passed).
   */
  url: string
  /** Request credentials. Default 'include'. */
  credentials?: RequestCredentials
  children?: ReactNode
}

/**
 * Provides the oRPC TanStack Query utils to the tree. SSR-safe: each request gets its own context value.
 * Pass only serializable props (url, credentials) so it can be used from a Server Component layout.
 * On the client, also syncs to the singleton so getORPC() works outside React.
 */
export function ORPCProvider({
  url,
  credentials = 'include',
  children,
}: ORPCProviderProps): React.ReactElement {
  const link = useMemo<ORPCClientLink>(
    () => ({
      url,
      fetch: (request, init) => fetch(request, { ...init, credentials }),
    }),
    [url, credentials],
  )

  const orpc = useMemo(
    () => createTanstackQueryUtils(createORPCClient(link)),
    [link],
  )

  useEffect(() => {
    configureORPC(link, orpc)
  }, [link, orpc])

  return <ORPCContext.Provider value={orpc}>{children}</ORPCContext.Provider>
}

/**
 * Returns the oRPC utils from context. Use this in components for SSR-safe access (e.g. orpc.patient.list.key() for cache invalidation).
 * Must be used within ORPCProvider.
 */
export function useORPC(): ORPCUtils {
  const orpc = useContext(ORPCContext)
  if (!orpc) {
    throw new Error(
      'useORPC must be used within ORPCProvider. Wrap your app with <ORPCProvider link={...}>.',
    )
  }
  return orpc
}
