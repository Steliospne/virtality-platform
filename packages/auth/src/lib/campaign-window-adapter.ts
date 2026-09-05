/**
 * Auth-side adapter for `@virtality/shared` campaign-window builders.
 * Prisma + Stripe wiring for the singleton Campaign Window.
 */
import type { PrismaClient } from '@virtality/db'
import { prisma } from '@virtality/db'
import {
  CAMPAIGN_WINDOW_SINGLETON_ID,
  assessCampaignCouponHealth,
  closeCampaignWindow,
  hadPaidBillingHistory,
  isCampaignAttachingForAdminboard,
  resolveCampaignCheckoutCouponId,
  resolveCampaignWindowLifecycle,
  toCampaignCheckoutSessionParams,
  upsertCampaignWindow,
  CampaignWindowValidationError,
  type CampaignCheckoutSessionParams,
  type CampaignCouponHealth,
  type CampaignWindowLifecycle,
  type CampaignWindowRecord,
  type CampaignWindowStore,
  type CouponLibraryRecord,
  type UpsertCampaignWindowInput,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { retrieveLibraryCoupon } from './coupon-library-adapter.ts'
import { registerCampaignCouponId } from './subscription-discount-read-adapter.ts'

type CampaignWindowRow = {
  id: string
  couponId: string
  startsAt: Date
  endsAt: Date
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function mapDbRow(row: CampaignWindowRow): CampaignWindowRecord {
  return {
    id: row.id,
    couponId: row.couponId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function assertCampaignCouponEligible(health: CampaignCouponHealth): void {
  switch (health) {
    case 'healthy':
      return
    case 'deleted':
      throw new CampaignWindowValidationError(
        'Select a Coupon from the Coupon library',
      )
    case 'archived':
      throw new CampaignWindowValidationError(
        'Archived Coupons cannot be used for a Campaign Window',
      )
    case 'applies_to_miss':
      throw new CampaignWindowValidationError(
        'Campaign Window Coupon must apply to Default',
      )
  }
}

export function createPrismaCampaignWindowStore(
  client: PrismaClient = prisma,
): CampaignWindowStore {
  return {
    get: async () => {
      const row = await client.campaignWindow.findUnique({
        where: { id: CAMPAIGN_WINDOW_SINGLETON_ID },
      })
      return row ? mapDbRow(row) : null
    },
    save: async (record) => {
      const row = await client.campaignWindow.upsert({
        where: { id: record.id },
        create: {
          id: record.id,
          couponId: record.couponId,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          closedAt: record.closedAt,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
        update: {
          couponId: record.couponId,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          closedAt: record.closedAt,
          updatedAt: record.updatedAt,
        },
      })
      return mapDbRow(row)
    },
  }
}

export type CampaignWindowView = {
  window: CampaignWindowRecord | null
  lifecycle: CampaignWindowLifecycle
  coupon: CouponLibraryRecord | null
  couponHealth: CampaignCouponHealth
  /** True when Subscribe Checkout would attach right now. */
  attaching: boolean
}

async function loadCouponHealth(
  stripeClient: Stripe,
  couponId: string,
): Promise<{
  coupon: CouponLibraryRecord | null
  couponHealth: CampaignCouponHealth
}> {
  try {
    const coupon = await retrieveLibraryCoupon(stripeClient, couponId)
    return { coupon, couponHealth: assessCampaignCouponHealth(coupon) }
  } catch {
    return { coupon: null, couponHealth: 'deleted' }
  }
}

export async function loadCampaignWindowView(deps: {
  prisma?: PrismaClient
  stripeClient: Stripe
  now?: Date
}): Promise<CampaignWindowView> {
  const client = deps.prisma ?? prisma
  const now = deps.now ?? new Date()
  const store = createPrismaCampaignWindowStore(client)
  const window = await store.get()
  const lifecycle = resolveCampaignWindowLifecycle(window, now)

  let coupon: CouponLibraryRecord | null = null
  let couponHealth: CampaignCouponHealth = 'deleted'
  if (window) {
    const loaded = await loadCouponHealth(deps.stripeClient, window.couponId)
    coupon = loaded.coupon
    couponHealth = loaded.couponHealth
  }

  return {
    window,
    lifecycle,
    coupon,
    couponHealth,
    attaching: isCampaignAttachingForAdminboard({
      window,
      couponHealth,
      now,
    }),
  }
}

export async function upsertCampaignWindowForAdminboard(
  input: UpsertCampaignWindowInput,
  deps: {
    prisma?: PrismaClient
    stripeClient: Stripe
    now?: () => Date
  },
): Promise<CampaignWindowRecord> {
  const client = deps.prisma ?? prisma
  const coupon = await retrieveLibraryCoupon(deps.stripeClient, input.couponId)
  assertCampaignCouponEligible(assessCampaignCouponHealth(coupon))

  const store = createPrismaCampaignWindowStore(client)
  return upsertCampaignWindow(store, input, {
    now: deps.now,
    onCouponSelected: (couponId) => registerCampaignCouponId(couponId, client),
  })
}

export async function closeCampaignWindowForAdminboard(
  deps: {
    prisma?: PrismaClient
    now?: () => Date
  } = {},
): Promise<CampaignWindowRecord | null> {
  const client = deps.prisma ?? prisma
  return closeCampaignWindow(createPrismaCampaignWindowStore(client), {
    now: deps.now,
  })
}

/**
 * Build Checkout Session params: always collect a card; optionally attach the
 * live healthy campaign Coupon for Subscribe (`!hadPaidBilling`). Never sets
 * `allow_promotion_codes` (Stripe forbids both with discounts).
 */
export async function buildCampaignAwareCheckoutSessionParams(input: {
  userId: string
  stripeCustomerId?: string | null
  prisma?: PrismaClient
  stripeClient: Stripe
  now?: Date
}): Promise<{ params: CampaignCheckoutSessionParams }> {
  const client = input.prisma ?? prisma
  const now = input.now ?? new Date()

  const orFilters: Array<
    { referenceId: string } | { stripeCustomerId: string }
  > = [{ referenceId: input.userId }]
  if (input.stripeCustomerId) {
    orFilters.push({ stripeCustomerId: input.stripeCustomerId })
  }

  const subscriptions = await client.subscription.findMany({
    where: { OR: orFilters },
    select: {
      status: true,
      trialEnd: true,
      periodEnd: true,
    },
  })

  const hadPaidBilling = hadPaidBillingHistory(subscriptions)
  const window = await createPrismaCampaignWindowStore(client).get()

  let couponHealth: CampaignCouponHealth = 'deleted'
  if (window) {
    couponHealth = (await loadCouponHealth(input.stripeClient, window.couponId))
      .couponHealth
  }

  const couponId = resolveCampaignCheckoutCouponId({
    window,
    couponHealth,
    hadPaidBilling,
    now,
  })

  return { params: toCampaignCheckoutSessionParams(couponId) }
}
