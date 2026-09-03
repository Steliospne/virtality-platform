'use client'

/**
 * Profile → Billing: stacked Monthly/Yearly Default cards + Checkout / Portal CTA,
 * Assigned Variant compare-at, Discount rewrite, and promo redeem (#78 / #190).
 */

import { Button } from '@virtality/ui/components/button'
import {
  BILLING_SOFT_UNAVAILABLE_COPY,
  profileBillingCardActiveAction,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
} from '@/lib/profile-billing'
import { PlanCard } from './billing-plan-card'
import { BillingSoftUnavailableBanner } from './billing-soft-unavailable-banner'
import { PromoRedeemSection } from './promo-redeem-section'
import { RemovePromoConfirmDialog } from './remove-promo-confirm-dialog'
import { RemoveSuccessBanner } from './remove-success-banner'
import { BillingTabSkeleton } from './billing-tab-skeleton'
import { IntervalUpgradeConfirmDialog } from './interval-upgrade-confirm-dialog'
import { IntervalCancelConfirmDialog } from './interval-cancel-confirm-dialog'
import { PendingCancellationBanner } from './pending-cancellation-banner'
import { PendingPlanChangeBanner } from './pending-plan-change-banner'
import { useBillingTab } from './use-billing-tab'

export function BillingTab() {
  const {
    isStandingPending,
    isCatalogPending,
    isCatalogUnavailable,
    standing,
    selectedInterval,
    setSelectedInterval,
    prices,
    cardDisplay,
    display,
    removeSuccess,
    setRemoveSuccess,
    redeemSuccessMessage,
    pendingCancellationBanner,
    pendingPlanChangeBanner,
    cta,
    showPlanCardCheckout,
    planCardActionFor,
    planCardCheckoutPending,
    portalPending,
    discount,
    hasEligibleSubscription,
    pendingHoldCode,
    pendingHoldExpiresAt,
    staffBlocked,
    redeemError,
    promoCode,
    setPromoCode,
    redeeming,
    handlePrimaryCta,
    handlePlanCardCheckout,
    handleRedeem,
    handleRemoveConfirm,
    handleCancelPendingHold,
    handlePendingHoldExpired,
    cancelPendingPending,
    removeOpen,
    setRemoveOpen,
    appliedPromoCode,
    removePending,
    upgradeConfirmOpen,
    setUpgradeConfirmOpen,
    upgradeConfirmCopy,
    handleUpgradeConfirm,
    upgradeConfirming,
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelConfirmCopy,
    handleCancelConfirm,
    cancelConfirming,
  } = useBillingTab()

  if (isStandingPending || isCatalogPending) {
    return <BillingTabSkeleton />
  }

  if (!prices || !cardDisplay) {
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

  const showPortalCta = cta != null
  const monthlyCheckout = showPlanCardCheckout
    ? profileBillingCardActiveAction(planCardActionFor('month'))
    : null
  const yearlyCheckout = showPlanCardCheckout
    ? profileBillingCardActiveAction(planCardActionFor('year'))
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

        {pendingCancellationBanner ? (
          <PendingCancellationBanner message={pendingCancellationBanner} />
        ) : null}

        {pendingPlanChangeBanner ? (
          <PendingPlanChangeBanner message={pendingPlanChangeBanner} />
        ) : null}

        {display.kind === 'soft_unavailable' ? (
          <BillingSoftUnavailableBanner />
        ) : null}

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <PlanCard
            title='Monthly'
            selected={selectedInterval === 'month'}
            disabled={standing.billingInterval === 'month'}
            onSelect={() => setSelectedInterval('month')}
            monthlyRows={cardDisplay.monthlyRows}
            checkoutAction={monthlyCheckout}
            checkoutPending={planCardCheckoutPending === 'month'}
            onCheckout={
              monthlyCheckout
                ? () => {
                    handlePlanCardCheckout('month')
                  }
                : undefined
            }
          />
          <PlanCard
            title='Yearly'
            selected={selectedInterval === 'year'}
            disabled={standing.billingInterval === 'year'}
            onSelect={() => setSelectedInterval('year')}
            yearlyRows={cardDisplay.yearlyRows}
            badge={prices.yearlySavingsLabel ?? undefined}
            accent
            checkoutAction={yearlyCheckout}
            checkoutPending={planCardCheckoutPending === 'year'}
            onCheckout={
              yearlyCheckout
                ? () => {
                    handlePlanCardCheckout('year')
                  }
                : undefined
            }
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

        {showPortalCta ? (
          <Button
            type='button'
            variant='outline'
            className='w-full'
            size='lg'
            disabled={portalPending}
            onClick={() => {
              void handlePrimaryCta()
            }}
          >
            {portalPending ? 'Opening portal…' : cta}
          </Button>
        ) : null}

        <PromoRedeemSection
          discount={discount}
          hasEligibleSubscription={hasEligibleSubscription}
          pendingHoldCode={pendingHoldCode}
          pendingHoldExpiresAt={pendingHoldExpiresAt}
          staffBlocked={staffBlocked}
          successFlash={removeSuccess}
          redeemError={redeemError}
          redeeming={redeeming}
          onRemove={() => setRemoveOpen(true)}
          onCancelPending={() => {
            void handleCancelPendingHold()
          }}
          onPendingExpired={handlePendingHoldExpired}
          cancelPendingPending={cancelPendingPending}
          onRedeem={handleRedeem}
          code={promoCode}
          onCodeChange={setPromoCode}
        />
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

      {upgradeConfirmCopy ? (
        <IntervalUpgradeConfirmDialog
          open={upgradeConfirmOpen}
          onOpenChange={setUpgradeConfirmOpen}
          title={upgradeConfirmCopy.title}
          body={upgradeConfirmCopy.body}
          confirmLabel={upgradeConfirmCopy.confirmLabel}
          confirming={upgradeConfirming}
          onConfirm={() => {
            void handleUpgradeConfirm()
          }}
        />
      ) : null}

      {cancelConfirmCopy ? (
        <IntervalCancelConfirmDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title={cancelConfirmCopy.title}
          body={cancelConfirmCopy.body}
          confirmLabel={cancelConfirmCopy.confirmLabel}
          confirming={cancelConfirming}
          onConfirm={() => {
            void handleCancelConfirm()
          }}
        />
      ) : null}
    </div>
  )
}
