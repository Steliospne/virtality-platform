'use client'

/**
 * Local state for the profile Billing tab: standing, Checkout, redeem, remove.
 */

import { useEffect, useRef, useState } from 'react'
import {
  useCancelPendingPromotionCode,
  useConsoleBillingCatalog,
  useConsolePromoRedeemPreflight,
  useConsoleSubscriptionDiscount,
  useRedeemPromotionCode,
  useRemovePromoDiscount,
  useSavePendingPromotionCode,
} from '@virtality/react-query'
import { authClient } from '@/auth-client'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { useSubscriptionBillingPortal } from '@/hooks/use-subscription-billing-portal'
import { useSubscriptionCheckout } from '@/hooks/use-subscription-checkout'
import { readCheckoutReturnIntent } from '@/lib/subscription-checkout'
import {
  BILLING_DISCOUNT_TIMING_COPY,
  billingCatalogMinor,
  billingCatalogPrices,
  buildPendingCouponRewrite,
  isStaffRedeemBlocked,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPlanCardCheckoutLabel,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPlanCardCheckout,
  profileBillingShowsPromoChrome,
  promoCodeLabel,
  type BillingInterval,
  type BillingStandingView,
  type PendingCouponTerms,
} from '@/lib/profile-billing'

function redeemSuccessCopy(promotionCode: string, replaced: boolean): string {
  if (replaced) {
    return `Promotion Code ${promotionCode} applied (replaced previous discount). ${BILLING_DISCOUNT_TIMING_COPY}`
  }
  return `Promotion Code ${promotionCode} applied. ${BILLING_DISCOUNT_TIMING_COPY}`
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useBillingTab() {
  const { data: session } = authClient.useSession()
  const standingQuery = useLiveEntitlementStanding()
  const catalogQuery = useConsoleBillingCatalog()
  const discountQuery = useConsoleSubscriptionDiscount()
  const preflightQuery = useConsolePromoRedeemPreflight()
  const redeemMutation = useRedeemPromotionCode()
  const savePendingMutation = useSavePendingPromotionCode()
  const cancelPendingMutation = useCancelPendingPromotionCode()
  const cancelPendingAsyncRef = useRef(cancelPendingMutation.mutateAsync)
  cancelPendingAsyncRef.current = cancelPendingMutation.mutateAsync
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
  const [pendingCouponTerms, setPendingCouponTerms] =
    useState<PendingCouponTerms | null>(null)
  const [planCardCheckoutPending, setPlanCardCheckoutPending] =
    useState<BillingInterval | null>(null)
  const [initialCheckoutIntent] = useState(() =>
    typeof window === 'undefined'
      ? null
      : readCheckoutReturnIntent(window.location.search),
  )
  const clearedCheckoutCancelRef = useRef(false)

  const prices = billingCatalogPrices(catalogQuery.data)
  const catalogMinor = billingCatalogMinor(catalogQuery.data)
  const standing: BillingStandingView = {
    entitled: standingQuery.entitled,
    status: standingQuery.data?.status ?? null,
    plan: standingQuery.data?.plan ?? null,
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
  const cta = profileBillingPrimaryCtaLabel(standing)
  const showPlanCardCheckout = profileBillingShowsPlanCardCheckout(
    standing,
    hasStripeCustomer,
  )
  const planCardCheckoutLabel = profileBillingPlanCardCheckoutLabel(
    standing,
    hasStripeCustomer,
  )
  const ctaPending = isCheckoutStarting || isPortalStarting
  const discount = discountQuery.data
  const display = profileBillingDiscountDisplay(discount, catalogMinor)
  const showPromoChrome = profileBillingShowsPromoChrome(standing)
  const hasEligibleSubscription = preflightQuery.data?.ok === true
  const staffBlocked = discount ? isStaffRedeemBlocked(discount) : false
  const appliedPromoCode = discount ? promoCodeLabel(discount) : null

  useEffect(() => {
    if (initialCheckoutIntent !== 'cancel') return
    if (clearedCheckoutCancelRef.current) return
    clearedCheckoutCancelRef.current = true
    setPendingCouponTerms(null)
    void cancelPendingAsyncRef.current(undefined)
  }, [initialCheckoutIntent])

  async function savePendingPromotionCode(code: string) {
    const result = await savePendingMutation.mutateAsync({ code })
    setPendingCouponTerms(result.couponTerms)
    setRemoveSuccess(false)
    setRedeemSuccessMessage(
      `Promotion Code ${code} saved for Checkout. Finish subscribing within 2 minutes.`,
    )
  }

  async function startCheckoutForInterval(interval: BillingInterval) {
    if (!hasEligibleSubscription && promoCode.trim()) {
      await savePendingPromotionCode(promoCode.trim())
      setPromoCode('')
    }
    await startCheckout({ annual: interval === 'year' })
  }

  async function handlePrimaryCta() {
    if (profileBillingOpensPortal(standing)) {
      await startPortal()
    }
  }

  async function handlePlanCardCheckout(interval: BillingInterval) {
    setSelectedInterval(interval)
    setPlanCardCheckoutPending(interval)
    try {
      await startCheckoutForInterval(interval)
    } finally {
      setPlanCardCheckoutPending(null)
    }
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

  const pendingRewrite =
    pendingCouponTerms && catalogMinor && prices
      ? buildPendingCouponRewrite(pendingCouponTerms, catalogMinor, prices)
      : null

  const rewrite =
    display.kind === 'rewrite' && prices
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
      : pendingRewrite

  return {
    isStandingPending: standingQuery.isPending,
    isCatalogPending: catalogQuery.isPending,
    isCatalogUnavailable: catalogQuery.data != null && !catalogQuery.data.ok,
    standing,
    selectedInterval,
    setSelectedInterval,
    prices,
    display,
    rewrite,
    removeSuccess,
    setRemoveSuccess,
    redeemSuccessMessage,
    cta,
    showPlanCardCheckout,
    planCardCheckoutLabel,
    planCardCheckoutPending,
    ctaPending,
    showPromoChrome,
    discount,
    hasEligibleSubscription,
    staffBlocked,
    redeemError,
    promoCode,
    setPromoCode,
    redeeming: redeemMutation.isPending || savePendingMutation.isPending,
    handlePrimaryCta,
    handlePlanCardCheckout,
    handleRedeem,
    handleRemoveConfirm,
    removeOpen,
    setRemoveOpen,
    appliedPromoCode,
    removePending: removeMutation.isPending,
  }
}
