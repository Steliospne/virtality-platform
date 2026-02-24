import { createORPCClient as _createORPCClient } from '@orpc/client'
import { RPCLink, RPCLinkOptions } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { router } from './router.ts'

export type ORPCClient = RouterClient<typeof router>

export function createORPCClient(link: RPCLinkOptions<any>): ORPCClient {
  return _createORPCClient(new RPCLink(link))
}
