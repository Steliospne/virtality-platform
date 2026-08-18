'use client'

/**
 * Profile → Billing: stacked Monthly/Yearly Pro cards + Checkout / Portal CTA,
 * Discount price rewrite, Promotion Code redeem, and promo remove (#78).
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Check, CheckCircle2, Info, X } from 'lucide-react'
import {
  useCancelPendingPromotionCode,
  useConsolePromoRedeemPreflight,
  useConsoleSubscriptionDiscount,
  useRedeemPromotionCode,
  useRemovePromoDiscount,
  useSavePendingPromotionCode,
} from '@virtality/react-query'
import type { SubscriptionDiscountRead } from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'
import { authClient } from '@/auth-client'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { useSubscriptionBillingPortal } from '@/hooks/use-subscription-billing-portal'
import { useSubscriptionCheckout } from '@/hooks/use-subscription-checkout'
import { readCheckoutReturnIntent } from '@/lib/subscription-checkout'
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
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  splitCatalogPriceLabel,
  type BillingInterval,
  type BillingStandingView,
} from '@/lib/profile-billing'
import { RedeemReplaceConfirmDialog } from './redeem-replace-confirm-dialog'
import { RemovePromoConfirmDialog } from './remove-promo-confirm-dialog'

type PlanPriceRewrite = {
  discountedPrimary: string
  listStrike: string
  discountedMuted?: string
  listStrikeMuted?: string
}

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

function PlanCardPrices({
  listPrimary,
  listMuted,
  rewrite,
}: {
  listPrimary: string
  listMuted?: string
  rewrite: PlanPriceRewrite | null
}) {
  if (rewrite) {
    return (
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
    )
  }

  return (
    <>
      <p className='text-lg font-semibold tabular-nums'>{listPrimary}</p>
      {listMuted ? (
        <p className='mt-0.5 text-sm text-zinc-400 tabular-nums'>{listMuted}</p>
      ) : null}
    </>
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
  rewrite: PlanPriceRewrite | null
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
          <PlanCardPrices
            listPrimary={listPrimary}
            listMuted={listMuted}
            rewrite={rewrite}
          />
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

function AppliedPromoRow({
  appliedCode,
  onRemove,
}: {
  appliedCode: string | null
  onRemove: () => void
}) {
  return (
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
  )
}

function PromoCodeEntryForm({
  code,
  onCodeChange,
  redeeming,
  redeemError,
  successFlash,
  onApply,
  applyLabel,
}: {
  code: string
  onCodeChange: (value: string) => void
  redeeming: boolean
  redeemError: string | null
  successFlash: boolean
  onApply: () => void
  applyLabel?: string
}) {
  return (
    <>
      {successFlash ? (
        <p className='text-sm text-emerald-700 dark:text-emerald-300'>
          You can enter a new Promotion Code below when ready.
        </p>
      ) : null}
      <div className='flex gap-2'>
        <Input
          value={code}
          onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
          placeholder='Enter code'
          className='font-mono'
          aria-label='Promotion Code'
          disabled={redeeming}
        />
        <Button
          type='button'
          variant='outline'
          disabled={!code.trim() || redeeming}
          onClick={onApply}
        >
          {redeeming ? 'Applying…' : (applyLabel ?? 'Apply')}
        </Button>
      </div>
      {redeemError ? (
        <p className='text-sm text-red-600 dark:text-red-400'>{redeemError}</p>
      ) : null}
    </>
  )
}

function promoRedeemBody({
  discount,
  hasEligibleSubscription,
  staffBlocked,
  onRemove,
  successFlash,
  redeemError,
  redeeming,
  code,
  onCodeChange,
  onApply,
}: {
  discount: SubscriptionDiscountRead | undefined
  hasEligibleSubscription: boolean
  staffBlocked: boolean
  onRemove: () => void
  successFlash: boolean
  redeemError: string | null
  redeeming: boolean
  code: string
  onCodeChange: (value: string) => void
  onApply: () => void
}): ReactNode {
  if (!hasEligibleSubscription) {
    return (
      <PromoCodeEntryForm
        code={code}
        onCodeChange={onCodeChange}
        redeeming={redeeming}
        redeemError={redeemError}
        successFlash={successFlash}
        onApply={onApply}
        applyLabel='Apply Code'
      />
    )
  }

  if (discount == null) {
    return <p className='text-sm text-zinc-500'>Checking current discount…</p>
  }

  if (!discount.ok) {
    return (
      <p className='text-sm text-zinc-500'>
        Promotion Code redeem is unavailable until discount details load. Try
        again shortly.
      </p>
    )
  }

  if (staffBlocked) {
    return <p className='text-sm text-zinc-500'>{STAFF_REDEEM_BLOCK_COPY}</p>
  }

  if (canRemovePromoDiscount(discount)) {
    return (
      <AppliedPromoRow
        appliedCode={promoCodeLabel(discount)}
        onRemove={onRemove}
      />
    )
  }

  return (
    <PromoCodeEntryForm
      code={code}
      onCodeChange={onCodeChange}
      redeeming={redeeming}
      redeemError={redeemError}
      successFlash={successFlash}
      onApply={onApply}
    />
  )
}

function PromoRedeemSection({
  discount,
  hasEligibleSubscription,
  staffBlocked,
  onRemove,
  successFlash,
  redeemError,
  onRedeem,
  redeeming,
  code,
  onCodeChange,
}: {
  discount: SubscriptionDiscountRead | undefined
  hasEligibleSubscription: boolean
  staffBlocked: boolean
  onRemove: () => void
  successFlash: boolean
  redeemError: string | null
  onRedeem: (code: string, confirmReplace: boolean) => Promise<boolean>
  redeeming: boolean
  code: string
  onCodeChange: (value: string) => void
}) {
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const currentLabel = hasEligibleSubscription
    ? replaceConfirmDiscountLabel(discount)
    : null

  async function submitApply(confirmReplace: boolean) {
    const trimmed = code.trim()
    if (!trimmed) return
    const ok = await onRedeem(trimmed, confirmReplace)
    if (ok) {
      onCodeChange('')
      setReplaceOpen(false)
      setPendingCode(null)
    }
  }

  async function handleApplyClick() {
    const trimmed = code.trim()
    if (!trimmed) return
    if (!hasEligibleSubscription) {
      await submitApply(false)
      return
    }
    if (!discount?.ok) return

    if (requiresReplaceConfirm(discount)) {
      setPendingCode(trimmed)
      setReplaceOpen(true)
      return
    }

    await submitApply(false)
  }

  return (
    <div className='space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
      <p className='text-sm font-medium'>Have a Promotion Code?</p>
      {promoRedeemBody({
        discount,
        hasEligibleSubscription,
        staffBlocked,
        onRemove,
        successFlash,
        redeemError,
        redeeming,
        code,
        onCodeChange,
        onApply: () => {
          void handleApplyClick()
        },
      })}

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

function primaryCtaPendingLabel(standing: BillingStandingView): string {
  if (profileBillingOpensPortal(standing)) return 'Opening portal…'
  return 'Starting Checkout…'
}

function redeemSuccessCopy(promotionCode: string, replaced: boolean): string {
  if (replaced) {
    return `Promotion Code ${promotionCode} applied (replaced previous discount). ${BILLING_DISCOUNT_TIMING_COPY}`
  }
  return `Promotion Code ${promotionCode} applied. ${BILLING_DISCOUNT_TIMING_COPY}`
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function BillingTab() {
  const { data: session } = authClient.useSession()
  const standingQuery = useLiveEntitlementStanding()
  const discountQuery = useConsoleSubscriptionDiscount()
  const preflightQuery = useConsolePromoRedeemPreflight()
  const redeemMutation = useRedeemPromotionCode()
  const savePendingMutation = useSavePendingPromotionCode()
  const cancelPendingMutation = useCancelPendingPromotionCode()
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
  const [promoCode, setPromoCode] = useState('')
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<
    string | null
  >(null)
  const [initialCheckoutIntent] = useState(() =>
    typeof window === 'undefined'
      ? null
      : readCheckoutReturnIntent(window.location.search),
  )

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
  const discount = discountQuery.data
  const display = profileBillingDiscountDisplay(discount)
  const showPromoChrome = profileBillingShowsPromoChrome(standing)
  const hasEligibleSubscription = preflightQuery.data?.ok === true
  const staffBlocked = discount ? isStaffRedeemBlocked(discount) : false
  const appliedPromoCode = discount ? promoCodeLabel(discount) : null

  useEffect(() => {
    if (initialCheckoutIntent !== 'cancel') return
    void cancelPendingMutation.mutateAsync(undefined)
  }, [cancelPendingMutation, initialCheckoutIntent])

  async function savePendingPromotionCode(code: string) {
    await savePendingMutation.mutateAsync({ code })
    setRemoveSuccess(false)
    setRedeemSuccessMessage(
      `Promotion Code ${code} saved for Checkout. Finish subscribing within 2 minutes.`,
    )
  }

  async function handlePrimaryCta() {
    if (profileBillingOpensPortal(standing)) {
      await startPortal()
      return
    }
    if (!hasEligibleSubscription && promoCode.trim()) {
      await savePendingPromotionCode(promoCode.trim())
      setPromoCode('')
    }
    await startCheckout({ annual: selectedInterval === 'year' })
  }

  async function handleRedeem(code: string, confirmReplace: boolean) {
    setRedeemError(null)
    setRedeemSuccessMessage(null)
    try {
      if (!hasEligibleSubscription) {
        await savePendingPromotionCode(code)
        setPromoCode('')
        return true
      }
      const result = await redeemMutation.mutateAsync({
        code,
        confirmReplace,
      })
      setRemoveSuccess(false)
      setRedeemSuccessMessage(
        redeemSuccessCopy(result.promotionCode, result.replaced),
      )
      return true
    } catch (error) {
      setRedeemError(
        errorMessage(error, 'Could not apply that Promotion Code.'),
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
        errorMessage(error, 'Could not remove that Promotion Code.'),
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
            {ctaPending ? primaryCtaPendingLabel(standing) : cta}
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
            hasEligibleSubscription={hasEligibleSubscription}
            staffBlocked={staffBlocked}
            successFlash={removeSuccess}
            redeemError={redeemError}
            redeeming={
              redeemMutation.isPending || savePendingMutation.isPending
            }
            onRemove={() => setRemoveOpen(true)}
            onRedeem={handleRedeem}
            code={promoCode}
            onCodeChange={setPromoCode}
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
