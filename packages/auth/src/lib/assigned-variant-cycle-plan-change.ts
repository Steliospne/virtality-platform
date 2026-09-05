/**
 * Period-end Default interval switch using the clinician's Assigned Variant Price
 * ids (Better Auth upgrade only knows the basic plan Price pair).
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  DEFAULT_SUBSCRIPTION_PLAN,
  isLiveEntitlementSubscriptionStatus,
  isDefaultSubscriptionPlan,
  type CyclePlanChangeResult,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { resolveAssignedPlanVariantChargePrice } from './plan-variant-catalog-adapter.ts'

export async function scheduleAssignedVariantCyclePlanChange(input: {
  stripeClient: Stripe
  prisma?: PrismaClient
  referenceId: string
  annual: boolean
}): Promise<CyclePlanChangeResult> {
  const client = input.prisma ?? prisma

  const user = await client.user.findFirst({
    where: { id: input.referenceId, deletedAt: null },
    select: { id: true, assignedDefaultVariant: true },
  })
  if (!user) {
    return { ok: false, message: 'Customer not found.' }
  }

  const priceResolved = await resolveAssignedPlanVariantChargePrice({
    stripeClient: input.stripeClient,
    assignedDefaultVariant: user.assignedDefaultVariant,
    annual: input.annual,
  })
  if (!priceResolved.ok) {
    return {
      ok: false,
      message:
        'Assigned Variant price pair is incomplete or unavailable. Fix the catalog before changing plan.',
    }
  }

  const subscription = await client.subscription.findFirst({
    where: {
      referenceId: user.id,
      plan: DEFAULT_SUBSCRIPTION_PLAN,
      status: { in: ['active', 'trialing'] },
      stripeSubscriptionId: { not: null },
    },
    orderBy: { id: 'desc' },
    select: {
      id: true,
      status: true,
      plan: true,
      stripeSubscriptionId: true,
      stripeScheduleId: true,
    },
  })

  if (
    !subscription?.stripeSubscriptionId ||
    !isDefaultSubscriptionPlan(subscription.plan) ||
    !isLiveEntitlementSubscriptionStatus(subscription.status)
  ) {
    return {
      ok: false,
      message: 'Cycle plan change requires a live paid Default subscription.',
    }
  }

  const stripeSub = await input.stripeClient.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  )
  const planItem = stripeSub.items.data[0]
  if (!planItem) {
    return { ok: false, message: 'Subscription has no Price item to change.' }
  }

  if (planItem.price.id === priceResolved.priceId) {
    return {
      ok: false,
      message: 'Customer is already on the selected paid Default interval.',
    }
  }

  if (stripeSub.schedule) {
    const scheduleId =
      typeof stripeSub.schedule === 'string'
        ? stripeSub.schedule
        : stripeSub.schedule.id
    await input.stripeClient.subscriptionSchedules.release(scheduleId)
    await client.subscription.update({
      where: { id: subscription.id },
      data: { stripeScheduleId: null },
    })
  }

  try {
    const schedule = await input.stripeClient.subscriptionSchedules.create({
      from_subscription: stripeSub.id,
    })
    const currentPhase = schedule.phases[0]
    if (!currentPhase) {
      return { ok: false, message: 'Subscription schedule has no phases.' }
    }

    const currentItems = currentPhase.items.map((item) => ({
      price: typeof item.price === 'string' ? item.price : item.price.id,
      quantity: item.quantity ?? 1,
    }))

    const newPhaseItems = currentPhase.items.map((item) => {
      const itemPriceId =
        typeof item.price === 'string' ? item.price : item.price.id
      if (itemPriceId === planItem.price.id) {
        return {
          price: priceResolved.priceId,
          quantity: item.quantity ?? 1,
        }
      }
      return {
        price: itemPriceId,
        quantity: item.quantity ?? 1,
      }
    })

    await input.stripeClient.subscriptionSchedules.update(schedule.id, {
      metadata: { source: 'virtality-assigned-variant' },
      end_behavior: 'release',
      phases: [
        {
          items: currentItems,
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date ?? undefined,
        },
        {
          items: newPhaseItems,
          start_date: currentPhase.end_date ?? undefined,
          proration_behavior: 'none',
        },
      ],
    })

    await client.subscription.update({
      where: { id: subscription.id },
      data: { stripeScheduleId: schedule.id },
    })

    return { ok: true, stripeScheduleId: schedule.id }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to schedule Cycle plan change'
    return { ok: false, message }
  }
}
