/**
 * Adminboard Coupon library domain: staff-managed reusable Stripe Coupons.
 * Stripe is source of truth; archive is app metadata on the Coupon.
 */

export const COUPON_LIBRARY_CURRENCY = 'eur' as const

/** Stripe Coupon metadata key: archive hides from apply picker. */
export const COUPON_LIBRARY_ARCHIVE_METADATA_KEY = 'virtality_archived' as const

/**
 * Canonical sandbox Pro Product (`prod_SaYNooLgBNvYvA`) for Coupon
 * `applies_to`. Same Product as Checkout / Access Code Prices in auth.
 */
export const PRO_PLAN_PRODUCT_ID = 'prod_SaYNooLgBNvYvA' as const

export const COUPON_LIBRARY_PLANS = [
  {
    planId: 'pro',
    productId: PRO_PLAN_PRODUCT_ID,
    label: 'Pro',
  },
] as const

export type CouponLibraryPlanId =
  (typeof COUPON_LIBRARY_PLANS)[number]['planId']

export const COUPON_DURATIONS = ['once', 'repeating', 'forever'] as const
export type CouponDuration = (typeof COUPON_DURATIONS)[number]

export type CouponLibraryRecord = {
  id: string
  name: string | null
  percentOff: number | null
  /** Minor units (cents) when amount-off. */
  amountOff: number | null
  currency: string | null
  duration: CouponDuration
  durationInMonths: number | null
  appliesToProductIds: string[]
  archived: boolean
  /** Unix seconds from Stripe `created`. */
  created: number
}

export type CreateLibraryCouponInput = {
  name: string
  /** Mutually exclusive with amountOff. */
  percentOff?: number
  /** Minor units; mutually exclusive with percentOff. Currency forced to catalog. */
  amountOff?: number
  /** Ignored on write; amount-off always uses catalog currency. */
  currency?: string
  duration: CouponDuration
  /** Required when duration is `repeating`. */
  durationInMonths?: number
  /** At least one; today `pro`. */
  planIds: CouponLibraryPlanId[]
}

export type UpdateLibraryCouponNameInput = {
  id: string
  name: string
}

export type CouponLibraryCreateParams = {
  name: string
  percentOff?: number
  amountOff?: number
  currency?: string
  duration: CouponDuration
  durationInMonths?: number
  productIds: string[]
}

export type CouponLibraryStripeGateway = {
  create: (input: CouponLibraryCreateParams) => Promise<CouponLibraryRecord>
  list: () => Promise<CouponLibraryRecord[]>
  updateName: (id: string, name: string) => Promise<CouponLibraryRecord>
  archive: (id: string) => Promise<CouponLibraryRecord>
  delete: (id: string) => Promise<void>
}

export class CouponLibraryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CouponLibraryValidationError'
  }
}

export class CouponLibraryNotFoundError extends Error {
  constructor(id: string) {
    super(`Coupon ${id} was not found.`)
    this.name = 'CouponLibraryNotFoundError'
  }
}

export function isCouponArchivedMetadata(
  metadata: Record<string, string> | null | undefined,
): boolean {
  return metadata?.[COUPON_LIBRARY_ARCHIVE_METADATA_KEY] === 'true'
}

export function resolveProductIdsForPlans(
  planIds: readonly string[],
): string[] {
  if (planIds.length === 0) {
    throw new CouponLibraryValidationError(
      'Select at least one plan for applies_to',
    )
  }

  const productIds: string[] = []
  const seen = new Set<string>()

  for (const planId of planIds) {
    const plan = COUPON_LIBRARY_PLANS.find((entry) => entry.planId === planId)
    if (!plan) {
      throw new CouponLibraryValidationError(`Unknown plan: ${planId}`)
    }
    if (!seen.has(plan.productId)) {
      seen.add(plan.productId)
      productIds.push(plan.productId)
    }
  }

  return productIds
}

export function listCouponsForApplyPicker(
  coupons: readonly CouponLibraryRecord[],
): CouponLibraryRecord[] {
  return coupons.filter((coupon) => !coupon.archived)
}

function requireTrimmedName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new CouponLibraryValidationError('Coupon name is required')
  }
  return trimmed
}

function assertCouponId(id: string): void {
  if (!id.trim()) {
    throw new CouponLibraryValidationError('Coupon id is required')
  }
}

function validateDiscountFields(input: CreateLibraryCouponInput): {
  percentOff?: number
  amountOff?: number
  currency?: string
} {
  const hasPercent = input.percentOff !== undefined && input.percentOff !== null
  const hasAmount = input.amountOff !== undefined && input.amountOff !== null

  if (hasPercent === hasAmount) {
    throw new CouponLibraryValidationError(
      'Provide either percentOff or amountOff, not both',
    )
  }

  if (hasPercent) {
    const percentOff = input.percentOff!
    if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
      throw new CouponLibraryValidationError(
        'percentOff must be greater than 0 and at most 100',
      )
    }
    return { percentOff }
  }

  const amountOff = input.amountOff!
  if (!Number.isInteger(amountOff) || amountOff <= 0) {
    throw new CouponLibraryValidationError(
      'amountOff must be a positive integer in minor units',
    )
  }

  if (
    input.currency !== undefined &&
    input.currency.toLowerCase() !== COUPON_LIBRARY_CURRENCY
  ) {
    throw new CouponLibraryValidationError(
      `amount-off currency must be ${COUPON_LIBRARY_CURRENCY}`,
    )
  }

  return { amountOff, currency: COUPON_LIBRARY_CURRENCY }
}

function validateDuration(input: CreateLibraryCouponInput): {
  duration: CouponDuration
  durationInMonths?: number
} {
  if (!COUPON_DURATIONS.includes(input.duration)) {
    throw new CouponLibraryValidationError(
      `duration must be one of: ${COUPON_DURATIONS.join(', ')}`,
    )
  }

  if (input.duration === 'repeating') {
    const months = input.durationInMonths
    if (months === undefined || !Number.isInteger(months) || months < 1) {
      throw new CouponLibraryValidationError(
        'durationInMonths is required for repeating Coupons',
      )
    }
    return { duration: 'repeating', durationInMonths: months }
  }

  if (input.durationInMonths !== undefined) {
    throw new CouponLibraryValidationError(
      'durationInMonths is only allowed for repeating Coupons',
    )
  }

  return { duration: input.duration }
}

export async function createLibraryCoupon(
  stripe: CouponLibraryStripeGateway,
  input: CreateLibraryCouponInput,
): Promise<CouponLibraryRecord> {
  const name = requireTrimmedName(input.name)
  const discount = validateDiscountFields(input)
  const duration = validateDuration(input)
  const productIds = resolveProductIdsForPlans(input.planIds)

  return stripe.create({
    name,
    ...discount,
    ...duration,
    productIds,
  })
}

export async function listLibraryCoupons(
  stripe: CouponLibraryStripeGateway,
): Promise<CouponLibraryRecord[]> {
  return stripe.list()
}

export async function updateLibraryCouponName(
  stripe: CouponLibraryStripeGateway,
  input: UpdateLibraryCouponNameInput,
): Promise<CouponLibraryRecord> {
  assertCouponId(input.id)
  const name = requireTrimmedName(input.name)
  return stripe.updateName(input.id, name)
}

export async function archiveLibraryCoupon(
  stripe: CouponLibraryStripeGateway,
  id: string,
): Promise<CouponLibraryRecord> {
  assertCouponId(id)
  return stripe.archive(id)
}

export async function deleteLibraryCoupon(
  stripe: CouponLibraryStripeGateway,
  id: string,
): Promise<void> {
  assertCouponId(id)
  await stripe.delete(id)
}

/** Convert major currency units (e.g. euros) to Stripe minor units. */
export function majorToMinorUnits(major: number): number {
  if (!Number.isFinite(major) || major <= 0) {
    throw new CouponLibraryValidationError('Amount must be a positive number')
  }
  const minor = Math.round(major * 100)
  if (minor <= 0) {
    throw new CouponLibraryValidationError(
      'Amount must be at least 0.01 in catalog currency',
    )
  }
  return minor
}
