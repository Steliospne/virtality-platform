import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { ORPCClient, ORPCClientLink } from '@virtality/orpc/client'
import { createORPCClient } from '@virtality/orpc/client'

export type ORPCUtils = ReturnType<typeof createTanstackQueryUtils<ORPCClient>>

let orpcInstance: ORPCUtils | null = null

/**
 * Configure the oRPC client (singleton). Used by ORPCProvider on the client so getORPC() works.
 * For SSR-safe apps, use ORPCProvider instead; configureORPC is then called internally on the client.
 */
export function configureORPC(
  link: ORPCClientLink,
  instance?: ORPCUtils,
): void {
  orpcInstance = instance ?? createTanstackQueryUtils(createORPCClient(link))
}

/**
 * Returns the configured oRPC utils from the singleton. Throws if not set.
 * Prefer useORPC() inside React components (SSR-safe). getORPC() is for use outside React (e.g. callbacks) and is client-only after ORPCProvider/configureORPC has run.
 */
export function getORPC(): ORPCUtils {
  if (!orpcInstance) {
    throw new Error(
      'ORPC not available. Use ORPCProvider (SSR-safe) or call configureORPC(link) at app entry.',
    )
  }
  return orpcInstance
}
