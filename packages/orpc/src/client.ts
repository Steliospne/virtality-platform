import { createORPCClient as _createORPCClient } from '@orpc/client'
import { RPCLink, RPCLinkOptions } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { Router } from './router.ts'

export type ORPCClient = RouterClient<Router>

export type ORPCClientLink = RPCLinkOptions<Router>

/** 
  Create an oRPC client from a link.
  @param link - The link to create the client from.
  @returns The created client.
**/
export function createORPCClient(link: RPCLinkOptions<any>): ORPCClient {
  return _createORPCClient(new RPCLink(link))
}

export type { RPCLinkOptions } from '@orpc/client/fetch'
export type { Router } from './router.ts'
