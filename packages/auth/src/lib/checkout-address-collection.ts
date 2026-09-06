/**
 * Billing/VAT address collection for Stripe Checkout. Shared by every
 * Checkout session-create call site — Better Auth's basic `pro` upgrade
 * (auth-instance.ts `getCheckoutSessionParams`) and the Assigned Variant
 * Subscribe path (assigned-variant-subscribe-checkout.ts), which calls
 * `stripeClient.checkout.sessions.create` directly and bypasses that hook.
 *
 * Shipping address collection is disabled for now; re-add
 * `shipping_address_collection` (and `shipping: 'auto'` in
 * `customer_update`) here if it needs to come back.
 */

import type Stripe from 'stripe'

/**
 * `hasCustomer` must be true only when the Session also passes an existing
 * Stripe `customer` id — `customer_update` is only valid alongside a
 * `customer` id, so it must stay out of the params when Checkout is instead
 * starting from a bare `customer_email` (no customer created yet).
 */
export function buildCheckoutAddressCollectionParams(options?: {
  hasCustomer?: boolean
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  'billing_address_collection' | 'tax_id_collection' | 'customer_update'
> {
  return {
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    ...(options?.hasCustomer
      ? {
          customer_update: { name: 'auto', address: 'auto' },
        }
      : {}),
  }
}
