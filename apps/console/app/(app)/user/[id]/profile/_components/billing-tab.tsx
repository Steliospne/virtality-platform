'use client'

/**
 * Profile → Billing: stacked Monthly/Yearly Pro cards + Checkout / Portal CTA,
 * Discount price rewrite, Promotion Code redeem, and promo remove (#78).
 */

import { Button } from '@virtality/ui/components/button'
import {
  BILLING_SOFT_UNAVAILABLE_COPY,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
} from '@/lib/profile-billing'
import { PlanCard } from './billing-plan-card'
import { PromoRedeemSection } from './promo-redeem-section'
import { RemovePromoConfirmDialog } from './remove-promo-confirm-dialog'
import { RemoveSuccessBanner } from './remove-success-banner'
import { BillingTabSkeleton } from './billing-tab-skeleton'
import { primaryCtaPendingLabel, useBillingTab } from './use-billing-tab'

function SoftUnavailableBanner() {
  return (
    <p className='rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900'>
      {BILLING_SOFT_UNAVAILABLE_COPY}
    </p>
  )
}

export function BillingTab() {
  const {
    isStandingPending,
    isCatalogPending,
    isCatalogUnavailable,
    standing,
    selectedInterval,
    setSelectedInterval,
    entitled,
    prices,
    display,
    rewrite,
    removeSuccess,
    setRemoveSuccess,
    redeemSuccessMessage,
    cta,
    ctaPending,
    showPromoChrome,
    discount,
    hasEligibleSubscription,
    staffBlocked,
    redeemError,
    promoCode,
    setPromoCode,
    redeeming,
    handlePrimaryCta,
    handleRedeem,
    handleRemoveConfirm,
    removeOpen,
    setRemoveOpen,
    appliedPromoCode,
    removePending,
  } = useBillingTab()

  if (isStandingPending || isCatalogPending) {
    return <BillingTabSkeleton />
  }

  if (!prices) {
    return (
      <div className='rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950'>
        <p className='text-sm text-zinc-500'>
          {isCatalogUnavailable
            ? BILLING_SOFT_UNAVAILABLE_COPY
            : 'Billing prices are unavailable right now. Try again shortly.'}
        </p>
      </div>
    )
  }

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
            badge={prices.yearlySavingsLabel ?? undefined}
            rewrite={rewrite?.yearly ?? null}
          />
        </div>

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
            redeeming={redeeming}
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
        confirming={removePending}
        onConfirm={() => {
          void handleRemoveConfirm()
        }}
      />
    </div>
  )
}
