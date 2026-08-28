/**
 * Console Cycle plan change schedule → shared module + Better Auth upgrade.
 */

import {
  scheduleCyclePlanChange as scheduleCyclePlanChangeShared,
  type CyclePlanChangePort,
} from '@virtality/shared/utils'

export type ScheduleCyclePlanChangeResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Schedules paid Pro monthly ↔ yearly at period end. Free → Paid stays on
 * `startProSubscriptionCheckout` (immediate).
 */
export async function scheduleCyclePlanChange(input: {
  upgrade: CyclePlanChangePort['upgrade']
  annual: boolean
  returnUrl: string
  referenceId?: string
}): Promise<ScheduleCyclePlanChangeResult> {
  const result = await scheduleCyclePlanChangeShared({
    port: { upgrade: input.upgrade },
    annual: input.annual,
    returnUrl: input.returnUrl,
    referenceId: input.referenceId,
  })

  if (!result.ok) {
    return { ok: false, message: result.message }
  }
  return { ok: true }
}
