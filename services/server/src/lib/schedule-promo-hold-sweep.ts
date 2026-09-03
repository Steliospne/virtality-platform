import cron, { type ScheduledTask } from 'node-cron'
import type { AppLogger } from '@virtality/shared/observability'
import { runPromoHoldSweep } from './promo-hold-sweep.ts'

// Holds carry a 2-minute TTL (PENDING_PROMOTION_CODE_TTL_MS); every minute
// bounds how long a lapsed Discount can stay live on Stripe to well under
// that window, while a signed-out user has nothing else that reverts it.
const PROMO_HOLD_SWEEP_CRON = '* * * * *'

export function schedulePromoHoldSweep(
  logger: AppLogger,
): ScheduledTask | null {
  if (process.env.PROMO_HOLD_SWEEP_ENABLED === 'false') {
    return null
  }

  const jobLogger = logger.child({
    component: 'billing',
    job: 'promo-hold-sweep',
  })

  return cron.schedule(
    PROMO_HOLD_SWEEP_CRON,
    () => {
      void runPromoHoldSweep(jobLogger).catch((error) => {
        jobLogger.error(
          'billing.promo_hold.sweep.failed',
          { error },
          'Scheduled promo hold sweep failed',
        )
      })
    },
    { timezone: 'UTC' },
  )
}
