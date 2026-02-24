import { os } from '@orpc/server'
import { AuthContext } from '@virtality/auth'
import { PrismaClient } from '@virtality/db'
import { VirtalityS3Client } from './s3/index.ts'
/**
 * Initial context provided by the server when handling requests.
 * The server should pass `headers` and, for authed procedures, set `user` and `session`
 * (e.g. from auth.api.getSession).
 */
export type InitialContext = {
  headers: Headers
  user: AuthContext['user']
  session: AuthContext['session']
  prisma: PrismaClient
  s3: VirtalityS3Client
}

const base = os.$context<InitialContext>()

export { base }
