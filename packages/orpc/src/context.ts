import { os } from '@orpc/server'
import type { AuthContext } from '@virtality/auth'
import type { PrismaClient } from '@virtality/db'
import type { MarketingCacheTag } from '@virtality/shared/types'
import type { VirtalityS3Client } from './s3/index.ts'

export type RevalidateWebsiteMarketingBody =
  | { tag: MarketingCacheTag }
  | { all: true }

/**
 * Initial context provided by the server when handling requests.
 * The server should pass `headers` and, for authed procedures, set `user` and `session`
 * (e.g. from auth.api.getSession).
 */
export type InitialContext = {
  headers: Headers
  request: Request
  user: AuthContext['user']
  session: AuthContext['session']
  prisma: PrismaClient
  s3: VirtalityS3Client
  /**
   * Best-effort website marketing cache bust after successful writes.
   * Wired by services/server; optional so unit tests can omit it.
   */
  revalidateWebsiteMarketingCache?: (
    body: RevalidateWebsiteMarketingBody,
  ) => Promise<void>
}

const base = os.$context<InitialContext>()

export { base }

/** Fire-and-forget helper — never fails the mutation. */
export async function bustWebsiteMarketingCache(
  context: InitialContext,
  body: RevalidateWebsiteMarketingBody,
): Promise<void> {
  if (!context.revalidateWebsiteMarketingCache) {
    return
  }
  await context.revalidateWebsiteMarketingCache(body)
}
