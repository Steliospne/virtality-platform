import { auth } from '../auth-instance.ts'

/**
 * Session user from Better Auth, plus Stripe plugin fields.
 * `stripeCustomerId` is not always inferred on `$Infer.Session.user` because the
 * Stripe plugin is only registered when `STRIPE_SECRET_KEY` is set.
 */
export type AuthUser = typeof auth.$Infer.Session.user & {
  stripeCustomerId?: string | null
}

export type AuthSession = {
  user: AuthUser
  session: typeof auth.$Infer.Session.session
}

export type AuthContext = {
  user: AuthUser | null
  session: typeof auth.$Infer.Session.session | null
}

/** Narrow `auth.api.getSession` when Stripe fields are missing from inference. */
export function asAuthSession(
  data: Awaited<ReturnType<typeof auth.api.getSession>>,
): AuthSession | null {
  return data as AuthSession | null
}
