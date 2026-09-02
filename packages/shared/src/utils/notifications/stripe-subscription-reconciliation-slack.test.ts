import { describe, expect, it } from 'vitest'
import {
  buildStripeSubscriptionReconciliationDriftSlackMessage,
  buildStripeSubscriptionReconciliationFailureSlackMessage,
} from './stripe-subscription-reconciliation-slack.ts'

describe('buildStripeSubscriptionReconciliationDriftSlackMessage', () => {
  it('returns null when no drift was found', () => {
    expect(
      buildStripeSubscriptionReconciliationDriftSlackMessage({ drift: [] }),
    ).toBeNull()
  })

  it('summarizes drift counts and identifying details', () => {
    const message = buildStripeSubscriptionReconciliationDriftSlackMessage({
      drift: [
        {
          kind: 'created',
          stripeSubscriptionId: 'sub_1',
          subscriptionId: 'local_1',
          userId: 'user_1',
        },
        {
          kind: 'unresolvable_user',
          stripeSubscriptionId: 'sub_2',
        },
        {
          kind: 'orphaned',
          subscriptionId: 'local_2',
          stripeSubscriptionId: 'sub_3',
          userId: 'user_2',
        },
      ],
    })

    expect(message).not.toBeNull()
    expect(message?.text).toContain('drift detected')
    expect(JSON.stringify(message)).toContain('Created locally')
    expect(JSON.stringify(message)).toContain('Unresolvable user')
    expect(JSON.stringify(message)).toContain('Orphaned locally')
    expect(JSON.stringify(message)).toContain('sub_1')
    expect(JSON.stringify(message)).toContain('sub_2')
    expect(JSON.stringify(message)).toContain('sub_3')
  })
})

describe('buildStripeSubscriptionReconciliationFailureSlackMessage', () => {
  it('includes stage and error message', () => {
    const message = buildStripeSubscriptionReconciliationFailureSlackMessage({
      stage: 'list_subscriptions',
      errorMessage: 'stripe unavailable',
    })

    expect(message.text).toContain('failed')
    expect(JSON.stringify(message)).toContain('list_subscriptions')
    expect(JSON.stringify(message)).toContain('stripe unavailable')
  })
})
