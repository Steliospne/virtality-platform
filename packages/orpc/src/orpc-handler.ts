import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
import { router } from './router.ts'

const ORPC_PREFIX = '/api/v1/rpc'

export const orpcHandler = new RPCHandler(router, {
  plugins: [],
  interceptors: [
    onError((error: unknown) => {
      console.error('oRPC error:', error)
    }),
  ],
})

export { ORPC_PREFIX }
