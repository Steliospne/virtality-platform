import { auth } from '../auth.ts'

/**
 * Session user from Better Auth, plus Stripe plugin fields.
 * `stripeCustomerId` is not always inferred on `$Infer.Session.user` because the
 * Stripe plugin is only registered when `STRIPE_SECRET_KEY` is set.
 */
type AuthUser = typeof auth.$Infer.Session.user & {
  stripeCustomerId?: string | null
}

export type AuthContext = {
  user: AuthUser | null
  session: typeof auth.$Infer.Session.session | null
}
