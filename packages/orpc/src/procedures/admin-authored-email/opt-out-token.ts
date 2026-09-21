import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  emailOptOutScopeSchema,
  type EmailOptOutScope,
} from '@virtality/shared/types'
import { z } from 'zod'

/**
 * Stateless, signed opt-out token carried by the footer link. It never
 * expires: an opt-out link in an old email must keep working.
 */
export type EmailOptOutTokenPayload = {
  email: string
  scope: EmailOptOutScope
}

const payloadSchema = z.object({
  e: z.string().email(),
  s: emailOptOutScopeSchema,
})

const toBase64Url = (value: string | Buffer) =>
  Buffer.from(value).toString('base64url')

const sign = (body: string, secret: string) =>
  createHmac('sha256', secret).update(body).digest('base64url')

export const signEmailOptOutToken = (
  payload: EmailOptOutTokenPayload,
  secret: string,
): string => {
  const body = toBase64Url(
    JSON.stringify({ e: payload.email.trim().toLowerCase(), s: payload.scope }),
  )
  return `${body}.${sign(body, secret)}`
}

export const verifyEmailOptOutToken = (
  token: string,
  secret: string,
): EmailOptOutTokenPayload | null => {
  const [body, signature, ...rest] = token.split('.')
  if (!body || !signature || rest.length > 0) {
    return null
  }

  const expected = sign(body, secret)
  const provided = Buffer.from(signature)
  const wanted = Buffer.from(expected)
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    return null
  }

  try {
    const parsed = payloadSchema.safeParse(
      JSON.parse(Buffer.from(body, 'base64url').toString('utf8')),
    )
    return parsed.success
      ? { email: parsed.data.e, scope: parsed.data.s }
      : null
  } catch {
    return null
  }
}

export const getEmailOptOutSecret = (
  env: NodeJS.ProcessEnv = process.env,
): string => {
  const secret = env.EMAIL_OPT_OUT_SECRET?.trim() || env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error(
      'EMAIL_OPT_OUT_SECRET or BETTER_AUTH_SECRET is required to sign opt-out links',
    )
  }
  return secret
}

/** Path on the public website that resolves an opt-out token. */
export const EMAIL_PREFERENCES_PATH = '/email-preferences'

export const buildEmailOptOutUrl = (websiteBase: string, token: string) =>
  `${websiteBase.replace(/\/$/, '')}${EMAIL_PREFERENCES_PATH}?token=${encodeURIComponent(token)}`
