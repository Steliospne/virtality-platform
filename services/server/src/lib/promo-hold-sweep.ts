import {
  stripeClient,
  sweepAllExpiredPromotionCodeHoldsAction,
} from '@virtality/auth'
import type { AppLogger } from '@virtality/shared/observability'

export async function runPromoHoldSweep(logger: AppLogger) {
  if (!stripeClient) {
    logger.warn('billing.promo_hold.sweep.skipped', {
      reason: 'stripe_not_configured',
    })
    return null
  }

  const result = await sweepAllExpiredPromotionCodeHoldsAction()
  if (result.reverted > 0) {
    logger.info('billing.promo_hold.sweep.completed', result)
  }
  // A left-open row means its Stripe revert failed (not merely "not due
  // yet" — sweepAllExpiredPromotionCodeHolds only counts rows already past
  // TTL). Surface it above routine activity so a stuck Discount isn't
  // silently retried forever without anyone noticing.
  if (result.retried > 0) {
    logger.warn(
      'billing.promo_hold.sweep.retry_pending',
      result,
      'Promo hold Stripe revert failed; will retry next sweep',
    )
  }
  return result
}
