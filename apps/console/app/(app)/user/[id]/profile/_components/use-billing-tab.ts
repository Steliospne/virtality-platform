'use client'

/**
 * Local state for the profile Billing tab: standing, Checkout, redeem, remove.
 */

import { useEffect, useState } from 'react'
import {
  useCancelPendingPromotionCode,
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
  PRO_BILLING_PRICES,
  isStaffRedeemBlocked,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPromoChrome,
  promoCodeLabel,
  type BillingInterval,
  type BillingStandingView,
} from '@/lib/profile-billing'

export function primaryCtaPendingLabel(standing: BillingStandingView): string {
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

export function useBillingTab() {
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

  return {
    isStandingPending: standingQuery.isPending,
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
    redeeming: redeemMutation.isPending || savePendingMutation.isPending,
    handlePrimaryCta,
    handleRedeem,
    handleRemoveConfirm,
    removeOpen,
    setRemoveOpen,
    appliedPromoCode,
    removePending: removeMutation.isPending,
  }
}
