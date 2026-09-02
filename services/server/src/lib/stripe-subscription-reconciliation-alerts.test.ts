import { describe, expect, it, vi } from 'vitest'
import type { ReconcileStripeSubscriptionsResult } from '@virtality/shared/utils'
import type { AppLogger } from '@virtality/shared/observability'
import {
  alertStripeSubscriptionReconciliationDrift,
  alertStripeSubscriptionReconciliationFailure,
  type StripeSubscriptionReconciliationAlertDeps,
} from './stripe-subscription-reconciliation-alerts.ts'

function createLogger(): AppLogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  }
}

function createDeps(
  overrides: Partial<StripeSubscriptionReconciliationAlertDeps> = {},
): StripeSubscriptionReconciliationAlertDeps {
  const sendSlack = overrides.sendSlack ?? vi.fn().mockResolvedValue(undefined)
  const logger = overrides.logger ?? createLogger()

  return {
    getWebhookUrl: () => 'https://hooks.slack.com/test',
    sendSlack,
    fetchImpl: vi.fn(),
    logger,
    ...overrides,
  }
}

describe('alertStripeSubscriptionReconciliationDrift', () => {
  it('sends a Slack summary when drift was found', async () => {
    const deps = createDeps()
    const result: ReconcileStripeSubscriptionsResult = {
      matched: 0,
      created: 1,
      skipped: 0,
      orphaned: 0,
      drift: [
        {
          kind: 'created',
          stripeSubscriptionId: 'sub_1',
          subscriptionId: 'local_1',
          userId: 'user_1',
        },
      ],
    }

    await alertStripeSubscriptionReconciliationDrift(result, deps)

    expect(deps.sendSlack).toHaveBeenCalledOnce()
    expect(deps.sendSlack).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        text: expect.stringContaining('drift'),
      }),
      'subscription-reconciliation',
      expect.objectContaining({
        fetchImpl: deps.fetchImpl,
        logger: deps.logger,
        failureEvent: 'billing.subscription.reconcile.slack_send.failed',
      }),
    )
  })

  it('skips Slack when the run found zero drift', async () => {
    const deps = createDeps()
    const result: ReconcileStripeSubscriptionsResult = {
      matched: 2,
      created: 0,
      skipped: 0,
      orphaned: 0,
      drift: [],
    }

    await alertStripeSubscriptionReconciliationDrift(result, deps)

    expect(deps.sendSlack).not.toHaveBeenCalled()
  })

  it('logs and does not throw when the webhook URL is missing', async () => {
    const deps = createDeps({
      getWebhookUrl: () => undefined,
    })

    await expect(
      alertStripeSubscriptionReconciliationDrift(
        {
          matched: 0,
          created: 1,
          skipped: 0,
          orphaned: 0,
          drift: [
            {
              kind: 'created',
              stripeSubscriptionId: 'sub_1',
              subscriptionId: 'local_1',
              userId: 'user_1',
            },
          ],
        },
        deps,
      ),
    ).resolves.toBeUndefined()

    expect(deps.logger.warn).toHaveBeenCalledWith(
      'billing.subscription.reconcile.slack_skipped',
      expect.objectContaining({ reason: 'missing_webhook' }),
    )
    expect(deps.sendSlack).not.toHaveBeenCalled()
  })
})

describe('alertStripeSubscriptionReconciliationFailure', () => {
  it('sends a Slack alert with stage and error detail', async () => {
    const deps = createDeps()

    await alertStripeSubscriptionReconciliationFailure(
      {
        stage: 'list_subscriptions',
        error: new Error('stripe unavailable'),
      },
      deps,
    )

    expect(deps.sendSlack).toHaveBeenCalledOnce()
    expect(deps.sendSlack).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        text: expect.stringContaining('failed'),
      }),
      'subscription-reconciliation',
      expect.objectContaining({
        failureEvent: 'billing.subscription.reconcile.slack_send.failed',
      }),
    )
  })

  it('logs Slack delivery failures without throwing', async () => {
    const sendSlack = vi.fn().mockRejectedValue(new Error('network down'))
    const deps = createDeps({ sendSlack })

    await expect(
      alertStripeSubscriptionReconciliationFailure(
        {
          stage: 'catalog_load',
          error: new Error('catalog unavailable'),
        },
        deps,
      ),
    ).resolves.toBeUndefined()

    expect(deps.logger.error).toHaveBeenCalledWith(
      'billing.subscription.reconcile.slack_alert_failed',
      expect.objectContaining({
        alert: 'failure',
        stage: 'catalog_load',
      }),
      'Failed to send Stripe subscription reconciliation Slack alert',
    )
  })
})
