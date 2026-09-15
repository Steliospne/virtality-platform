import { RPCHandler } from '@orpc/server/fetch'
import { onError, ORPCError, ValidationError } from '@orpc/server'
import { createAppLogger } from '@virtality/shared/observability'
import type { InitialContext } from './context.ts'
import { router } from './router.ts'

const orpcLogger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    component: 'orpc',
  },
})

/** `path` + `message` per issue; enough to name the offending field. */
function toIssueSummaries(error: ORPCError<string, unknown>) {
  if (!(error.cause instanceof ValidationError)) return undefined
  return error.cause.issues.map((issue) => ({
    path: issue.path
      ?.map((segment) =>
        typeof segment === 'object' ? String(segment.key) : String(segment),
      )
      .join('.'),
    message: issue.message,
  }))
}

export const orpcHandler = new RPCHandler(router, {
  plugins: [],
  // Procedure-level so the failing procedure and its input are known. The
  // console swallows most rejected writes, so this log is often the only
  // record of why an RPC returned 4xx.
  clientInterceptors: [
    onError((error: unknown, { path, context, input }) => {
      const orpcError =
        error instanceof ORPCError
          ? error
          : new ORPCError('INTERNAL_SERVER_ERROR', { cause: error })
      const level = orpcError.status >= 500 ? 'error' : 'warn'
      const ctx = context as Partial<InitialContext>
      orpcLogger[level]('orpc.procedure.failed', {
        procedure: path.join('.'),
        code: orpcError.code,
        statusCode: orpcError.status,
        errorMessage: orpcError.message,
        issues: toIssueSummaries(orpcError),
        input,
        requestId: ctx.request?.headers.get('x-request-id') ?? undefined,
        userId: ctx.user?.id,
        error: orpcError.status >= 500 ? error : undefined,
      })
    }),
  ],
})
