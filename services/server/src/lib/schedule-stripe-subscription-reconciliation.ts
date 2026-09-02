import cron, { type ScheduledTask } from 'node-cron'
import type { AppLogger } from '@virtality/shared/observability'
import { runStripeSubscriptionReconciliation } from './stripe-subscription-reconciliation.ts'

const RECONCILIATION_CRON = '0 2 * * *'

export function scheduleStripeSubscriptionReconciliation(
  logger: AppLogger,
): ScheduledTask | null {
  if (process.env.STRIPE_SUBSCRIPTION_RECONCILIATION_ENABLED === 'false') {
    return null
  }

  const jobLogger = logger.child({
    component: 'billing',
    job: 'stripe-subscription-reconciliation',
  })

  return cron.schedule(
    RECONCILIATION_CRON,
    () => {
      void runStripeSubscriptionReconciliation(jobLogger).catch((error) => {
        jobLogger.error(
          'billing.subscription.reconcile.failed',
          { error },
          'Scheduled Stripe subscription reconciliation failed',
        )
      })
    },
    { timezone: 'UTC' },
  )
}

export { runStripeSubscriptionReconciliation }
