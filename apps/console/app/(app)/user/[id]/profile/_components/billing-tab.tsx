'use client'

/**
 * Profile → Billing: stacked Monthly/Yearly Pro cards + Checkout / Portal CTA,
 * Discount price rewrite, Promotion Code redeem, and promo remove (#78).
 */

import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Info, X } from 'lucide-react'
import {
  useConsoleSubscriptionDiscount,
  useRedeemPromotionCode,
  useRemovePromoDiscount,
} from '@virtality/react-query'
import type { SubscriptionDiscountRead } from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'
import { authClient } from '@/auth-client'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { useSubscriptionBillingPortal } from '@/hooks/use-subscription-billing-portal'
import { useSubscriptionCheckout } from '@/hooks/use-subscription-checkout'
import { cn } from '@/lib/utils'
import {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  PRO_BILLING_PRICES,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  canRemovePromoDiscount,
  isStaffRedeemBlocked,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPromoChrome,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  promoCodeLabel,
  splitCatalogPriceLabel,
  type BillingInterval,
  type BillingStandingView,
} from '@/lib/profile-billing'
import { RedeemReplaceConfirmDialog } from './redeem-replace-confirm-dialog'
import { RemovePromoConfirmDialog } from './remove-promo-confirm-dialog'

function PriceLine({
  primary,
  strike,
  primaryClassName = 'text-lg font-semibold',
  catalogClassName = 'text-lg font-semibold',
}: {
  primary: string
  strike?: string
  primaryClassName?: string
  catalogClassName?: string
}) {
  if (!strike) {
    return <p className={cn('tabular-nums', primaryClassName)}>{primary}</p>
  }
  const { amount, interval } = splitCatalogPriceLabel(strike)
  return (
    <div className='flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5'>
      <p className={cn('tabular-nums', primaryClassName)}>{primary}</p>
      <p className={cn('tabular-nums', catalogClassName)}>
        <span className='text-zinc-400 line-through'>{amount}</span>
        {interval ? ` ${interval}` : null}
      </p>
    </div>
  )
}

function PlanCard({
  title,
  description,
  selected,
  disabled,
  onSelect,
  listPrimary,
  listMuted,
  badge,
  rewrite,
}: {
  title: string
  description: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
  listPrimary: string
  listMuted?: string
  badge?: string
  rewrite: {
    discountedPrimary: string
    listStrike: string
    discountedMuted?: string
    listStrikeMuted?: string
  } | null
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-xl border-2 p-5 text-left transition',
        selected
          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800',
        disabled && 'opacity-60',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-lg font-semibold'>{title}</p>
            {badge ? <Badge>{badge}</Badge> : null}
          </div>
          <p className='mt-1 text-sm text-zinc-500'>{description}</p>
        </div>
        <div className='text-right'>
          {rewrite ? (
            <>
              <PriceLine
                primary={rewrite.discountedPrimary}
                strike={rewrite.listStrike}
              />
              {rewrite.discountedMuted ? (
                <div className='mt-0.5'>
                  <PriceLine
                    primary={rewrite.discountedMuted}
                    strike={rewrite.listStrikeMuted}
                    primaryClassName='text-sm font-medium'
                    catalogClassName='text-sm font-medium'
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className='text-lg font-semibold tabular-nums'>
                {listPrimary}
              </p>
              {listMuted ? (
                <p className='mt-0.5 text-sm text-zinc-400 tabular-nums'>
                  {listMuted}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
      {selected ? (
        <p className='mt-3 flex items-center gap-1.5 text-sm font-medium'>
          <Check className='size-4' /> Selected
        </p>
      ) : null}
    </button>
  )
}

function SoftUnavailableBanner() {
  return (
    <p className='rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900'>
      {BILLING_SOFT_UNAVAILABLE_COPY}
    </p>
  )
}

function RemoveSuccessBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40'>
      <div className='flex gap-2'>
        <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300' />
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-emerald-900 dark:text-emerald-100'>
            {PROMO_REMOVE_SUCCESS_COPY}
          </p>
          <p className='mt-0.5 text-sm text-emerald-800 dark:text-emerald-200'>
            Catalog list prices apply on your next invoice.{' '}
            {BILLING_DISCOUNT_TIMING_COPY}
          </p>
        </div>
        <button
          type='button'
          onClick={onDismiss}
          className='shrink-0 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300'
          aria-label='Dismiss'
        >
          <X className='size-4' />
        </button>
      </div>
    </div>
  )
}

function PromoRedeemSection({
  discount,
  staffBlocked,
  onRemove,
  successFlash,
  redeemError,
  onRedeem,
  redeeming,
}: {
  discount: SubscriptionDiscountRead | undefined
  staffBlocked: boolean
  onRemove: () => void
  successFlash: boolean
  redeemError: string | null
  onRedeem: (code: string, confirmReplace: boolean) => Promise<boolean>
  redeeming: boolean
}) {
  const [code, setCode] = useState('')
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const promoActive = discount ? canRemovePromoDiscount(discount) : false
  const appliedCode = discount ? promoCodeLabel(discount) : null
  const currentLabel =
    discount &&
    discount.ok &&
    discount.presence === 'one' &&
    (discount.channel === 'promo' || discount.channel === 'campaign')
      ? (promoCodeLabel(discount) ?? discount.couponName ?? discount.couponId)
      : null

  async function submitApply(confirmReplace: boolean) {
    const trimmed = code.trim()
    if (!trimmed) return
    const ok = await onRedeem(trimmed, confirmReplace)
    if (ok) {
      setCode('')
      setReplaceOpen(false)
      setPendingCode(null)
    }
  }

  async function handleApplyClick() {
    const trimmed = code.trim()
    if (!trimmed || !discount?.ok) return

    if (
      discount.presence === 'one' &&
      (discount.channel === 'campaign' || discount.channel === 'promo')
    ) {
      setPendingCode(trimmed)
      setReplaceOpen(true)
      return
    }

    await submitApply(false)
  }

  const readFailed = discount != null && !discount.ok
  const readPending = discount == null

  return (
    <div className='space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
      <p className='text-sm font-medium'>Have a Promotion Code?</p>
      {readPending ? (
        <p className='text-sm text-zinc-500'>Checking current discount…</p>
      ) : readFailed ? (
        <p className='text-sm text-zinc-500'>
          Promotion Code redeem is unavailable until discount details load. Try
          again shortly.
        </p>
      ) : staffBlocked ? (
        <p className='text-sm text-zinc-500'>{STAFF_REDEEM_BLOCK_COPY}</p>
      ) : promoActive ? (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary' className='font-mono'>
              {appliedCode ?? 'Applied'}
            </Badge>
            <span className='text-sm text-zinc-600 dark:text-zinc-400'>
              Promotion Code on your subscription
            </span>
          </div>
          <Button type='button' variant='outline' size='sm' onClick={onRemove}>
            Remove discount
          </Button>
        </div>
      ) : (
        <>
          {successFlash ? (
            <p className='text-sm text-emerald-700 dark:text-emerald-300'>
              You can enter a new Promotion Code below when ready.
            </p>
          ) : null}
          <div className='flex gap-2'>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder='Enter code'
              className='font-mono'
              aria-label='Promotion Code'
              disabled={redeeming}
            />
            <Button
              type='button'
              variant='outline'
              disabled={!code.trim() || redeeming}
              onClick={() => {
                void handleApplyClick()
              }}
            >
              {redeeming ? 'Applying…' : 'Apply'}
            </Button>
          </div>
          {redeemError ? (
            <p className='text-sm text-red-600 dark:text-red-400'>
              {redeemError}
            </p>
          ) : null}
        </>
      )}

      <RedeemReplaceConfirmDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        code={pendingCode ?? code}
        currentLabel={currentLabel}
        confirming={redeeming}
        onConfirm={() => {
          void submitApply(true)
        }}
      />
    </div>
  )
}

export function BillingTab() {
  const { data: session } = authClient.useSession()
  const standingQuery = useLiveEntitlementStanding()
  const discountQuery = useConsoleSubscriptionDiscount()
  const redeemMutation = useRedeemPromotionCode()
  const removeMutation = useRemovePromoDiscount()
  const { startCheckout, isStarting: isCheckoutStarting } =
    useSubscriptionCheckout()
  const { startPortal, isStarting: isPortalStarting } =
    useSubscriptionBillingPortal()

  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>('month')
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeSuccess, setRemoveSuccess] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<
    string | null
  >(null)

  const prices = PRO_BILLING_PRICES
  const entitled = standingQuery.entitled
  const standing: BillingStandingView = {
    entitled,
    status: standingQuery.data?.status ?? null,
    billingPathEstablished: standingQuery.data?.billingPathEstablished ?? false,
    hadPaidBilling: standingQuery.data?.hadPaidBilling ?? false,
    billingInterval: standingQuery.data?.billingInterval ?? null,
    clockEnd: standingQuery.data?.clockEnd ?? null,
  }

  useEffect(() => {
    if (standing.billingInterval) {
      setSelectedInterval(standing.billingInterval)
    }
  }, [standing.billingInterval])

  const hasStripeCustomer = Boolean(
    (session?.user as { stripeCustomerId?: string | null } | undefined)
      ?.stripeCustomerId,
  )
  const cta = profileBillingPrimaryCtaLabel(standing, hasStripeCustomer)
  const ctaPending = isCheckoutStarting || isPortalStarting
  const discount = discountQuery.data as SubscriptionDiscountRead | undefined
  const display = profileBillingDiscountDisplay(discount)
  const showPromoChrome = profileBillingShowsPromoChrome(standing)
  const staffBlocked = discount ? isStaffRedeemBlocked(discount) : false
  const appliedPromoCode = discount ? promoCodeLabel(discount) : null

  async function handlePrimaryCta() {
    if (profileBillingOpensPortal(standing)) {
      await startPortal()
      return
    }
    await startCheckout({ annual: selectedInterval === 'year' })
  }

  async function handleRedeem(code: string, confirmReplace: boolean) {
    setRedeemError(null)
    setRedeemSuccessMessage(null)
    try {
      const result = await redeemMutation.mutateAsync({
        code,
        confirmReplace,
      })
      setRemoveSuccess(false)
      setRedeemSuccessMessage(
        result.replaced
          ? `Promotion Code ${result.promotionCode} applied (replaced previous discount). ${BILLING_DISCOUNT_TIMING_COPY}`
          : `Promotion Code ${result.promotionCode} applied. ${BILLING_DISCOUNT_TIMING_COPY}`,
      )
      return true
    } catch (error) {
      setRedeemError(
        error instanceof Error
          ? error.message
          : 'Could not apply that Promotion Code.',
      )
      return false
    }
  }

  async function handleRemoveConfirm() {
    try {
      await removeMutation.mutateAsync(undefined)
      setRemoveOpen(false)
      setRemoveSuccess(true)
      setRedeemSuccessMessage(null)
    } catch (error) {
      setRedeemError(
        error instanceof Error
          ? error.message
          : 'Could not remove that Promotion Code.',
      )
      setRemoveOpen(false)
    }
  }

  if (standingQuery.isPending) {
    return <p className='text-sm text-zinc-500'>Loading billing…</p>
  }

  const rewrite =
    display.kind === 'rewrite'
      ? {
          monthly: {
            discountedPrimary: display.prices.monthlyAmount,
            listStrike: prices.monthlyLabel,
          },
          yearly: {
            discountedPrimary: display.prices.yearlyAsMonthlyAmount,
            listStrike: prices.yearlyAsMonthlyLabel,
            discountedMuted: display.prices.yearlyTotalAmount,
            listStrikeMuted: prices.yearlyTotalMutedLabel,
          },
        }
      : null

  return (
    <div className='rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
            Billing
          </p>
          <h2 className='text-2xl font-semibold tracking-tight'>
            {profileBillingStatusHeadline(standing)}
          </h2>
          <p className='text-sm text-zinc-500'>
            {profileBillingStatusDetail(standing)}
          </p>
        </header>

        {display.kind === 'soft_unavailable' ? <SoftUnavailableBanner /> : null}

        <div className='grid gap-3'>
          <PlanCard
            title='Monthly'
            description='Flexible. Cancel anytime before renewal.'
            selected={selectedInterval === 'month'}
            disabled={entitled}
            onSelect={() => setSelectedInterval('month')}
            listPrimary={prices.monthlyLabel}
            rewrite={rewrite?.monthly ?? null}
          />
          <PlanCard
            title='Yearly'
            description='One payment. Same Pro access for twelve months.'
            selected={selectedInterval === 'year'}
            disabled={entitled}
            onSelect={() => setSelectedInterval('year')}
            listPrimary={prices.yearlyAsMonthlyLabel}
            listMuted={prices.yearlyTotalMutedLabel}
            badge={prices.yearlySavingsLabel}
            rewrite={rewrite?.yearly ?? null}
          />
        </div>

        {rewrite ? (
          <p className='flex gap-2 text-xs text-zinc-500'>
            <Info className='mt-0.5 size-3.5 shrink-0' />
            <span>
              Discounted figures are catalog list × Coupon (not a live invoice
              preview). {BILLING_DISCOUNT_TIMING_COPY}
            </span>
          </p>
        ) : null}

        {removeSuccess ? (
          <RemoveSuccessBanner onDismiss={() => setRemoveSuccess(false)} />
        ) : null}

        {redeemSuccessMessage ? (
          <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'>
            {redeemSuccessMessage}
          </div>
        ) : null}

        {cta ? (
          <Button
            type='button'
            variant='primary'
            className='w-full'
            size='lg'
            disabled={ctaPending}
            onClick={() => {
              void handlePrimaryCta()
            }}
          >
            {ctaPending
              ? profileBillingOpensPortal(standing)
                ? 'Opening portal…'
                : 'Starting Checkout…'
              : cta}
          </Button>
        ) : (
          <p className='text-center text-sm text-zinc-500'>
            Billing is unavailable until a Stripe Customer is linked to this
            account.
          </p>
        )}

        {showPromoChrome ? (
          <PromoRedeemSection
            discount={discount}
            staffBlocked={staffBlocked}
            successFlash={removeSuccess}
            redeemError={redeemError}
            redeeming={redeemMutation.isPending}
            onRemove={() => setRemoveOpen(true)}
            onRedeem={handleRedeem}
          />
        ) : null}
      </div>

      <RemovePromoConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        promotionCode={appliedPromoCode}
        confirming={removeMutation.isPending}
        onConfirm={() => {
          void handleRemoveConfirm()
        }}
      />
    </div>
  )
}
