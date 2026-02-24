import {
  createTanstackQueryUtils,
  type RouterUtils,
} from '@orpc/tanstack-query'
import {
  ORPC_PREFIX,
  RouterClient,
  router,
  RPCLinkOptions,
} from '@virtality/orpc'
import { createORPCClient } from '@virtality/orpc'

/**
 * This is part of the Optimize SSR setup.
 *
 * @see {@link https://orpc.dev/docs/adapters/next#optimize-ssr}
 */
declare global {
  var $client: RouterClient<typeof router> | undefined
}

const link = {
  url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:8080'}${ORPC_PREFIX}`,
  fetch: (request, init) => {
    return globalThis.fetch(request, { ...init, credentials: 'include' })
  },
} satisfies RPCLinkOptions<typeof router>

export const client: RouterClient<typeof router> =
  globalThis.$client ?? createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
