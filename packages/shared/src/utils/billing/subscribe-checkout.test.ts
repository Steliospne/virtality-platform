import { describe, expect, it } from 'vitest'
import {
  FREE_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLAN,
  shouldRouteSubscribeCheckoutViaAssignedVariant,
} from './subscribe-checkout.ts'

describe('shouldRouteSubscribeCheckoutViaAssignedVariant', () => {
  it('routes trialing Free seats through Assigned Variant checkout', () => {
    expect(
      shouldRouteSubscribeCheckoutViaAssignedVariant({
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
      }),
    ).toBe(true)
  })

  it('routes active Free seats through Assigned Variant checkout', () => {
    expect(
      shouldRouteSubscribeCheckoutViaAssignedVariant({
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    ).toBe(true)
  })

  it('keeps never-subscribed and Renew on Better Auth checkout', () => {
    expect(
      shouldRouteSubscribeCheckoutViaAssignedVariant({
        plan: null,
        status: null,
      }),
    ).toBe(false)
    expect(
      shouldRouteSubscribeCheckoutViaAssignedVariant({
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
      }),
    ).toBe(false)
  })

  it('keeps live paid Pro on portal / cycle plan change', () => {
    expect(
      shouldRouteSubscribeCheckoutViaAssignedVariant({
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    ).toBe(false)
  })
})
