import { describe, expect, it } from 'vitest'
import {
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  type BillingStandingView,
} from './profile-billing.js'

const base: BillingStandingView = {
  entitled: false,
  status: null,
  billingPathEstablished: false,
  hadPaidBilling: false,
  billingInterval: null,
  clockEnd: null,
}

describe('profileBillingPrimaryCtaLabel', () => {
  it('opens portal copy while entitled', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        { ...base, entitled: true, status: 'active' },
        true,
      ),
    ).toBe('Manage in portal')
  })

  it('uses Become a paying customer when Customer exists without Billing Path', () => {
    expect(profileBillingPrimaryCtaLabel(base, true)).toBe(
      'Become a paying customer',
    )
  })

  it('uses Subscribe after Billing Path without paid history', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        { ...base, billingPathEstablished: true },
        true,
      ),
    ).toBe('Subscribe')
  })

  it('uses Renew after paid history', () => {
    expect(
      profileBillingPrimaryCtaLabel(
        {
          ...base,
          billingPathEstablished: true,
          hadPaidBilling: true,
        },
        true,
      ),
    ).toBe('Renew')
  })

  it('hides CTA without a Stripe Customer', () => {
    expect(profileBillingPrimaryCtaLabel(base, false)).toBeNull()
  })
})

describe('profileBillingOpensPortal', () => {
  it('is true only while entitled', () => {
    expect(profileBillingOpensPortal({ entitled: true })).toBe(true)
    expect(profileBillingOpensPortal({ entitled: false })).toBe(false)
  })
})

describe('profileBillingStatusHeadline', () => {
  it('describes active, trial, and empty seats', () => {
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'active',
        billingInterval: 'year',
      }),
    ).toBe('Pro · Yearly')
    expect(
      profileBillingStatusHeadline({
        ...base,
        entitled: true,
        status: 'trialing',
      }),
    ).toBe('Trial in progress')
    expect(profileBillingStatusHeadline(base)).toBe('No plan yet')
  })
})

describe('profileBillingStatusDetail', () => {
  it('prompts interval choice when there is no live clock', () => {
    expect(profileBillingStatusDetail(base)).toMatch(/Monthly or Yearly/)
  })
})
