/**
 * Billing/VAT and shipping address collection for Stripe Checkout. Shared by
 * every Checkout session-create call site — Better Auth's basic `pro` upgrade
 * (auth-instance.ts `getCheckoutSessionParams`) and the Assigned Variant
 * Subscribe path (assigned-variant-subscribe-checkout.ts), which calls
 * `stripeClient.checkout.sessions.create` directly and bypasses that hook.
 */

import type Stripe from 'stripe'

/** Shipping is currently limited to Greece and Cyprus; extend as we expand. */
const SHIPPING_ALLOWED_COUNTRIES: Array<
  Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry
> = ['GR', 'CY']

/**
 * `hasCustomer` must be true only when the Session also passes an existing
 * Stripe `customer` id. Tax ID collection requires Stripe to be allowed to
 * write the collected shipping address back onto that Customer
 * (`customer_update.shipping = 'auto'`) — Stripe rejects the Session at
 * create time otherwise. `customer_update` itself is only valid alongside a
 * `customer` id, so it must stay out of the params when Checkout is instead
 * starting from a bare `customer_email` (no customer created yet).
 */
export function buildCheckoutAddressCollectionParams(options?: {
  hasCustomer?: boolean
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  | 'billing_address_collection'
  | 'tax_id_collection'
  | 'shipping_address_collection'
  | 'customer_update'
> {
  return {
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    shipping_address_collection: {
      allowed_countries: SHIPPING_ALLOWED_COUNTRIES,
    },
    ...(options?.hasCustomer
      ? {
          customer_update: { name: 'auto', address: 'auto', shipping: 'auto' },
        }
      : {}),
  }
}
