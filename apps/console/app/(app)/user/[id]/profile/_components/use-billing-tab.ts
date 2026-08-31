'use client'

/**
 * Local state for the profile Billing tab: standing, Checkout, redeem, remove,
 * and period-end interval switch confirm / cancel.
 */

import { useEffect, useRef, useState } from 'react'
import {
  useCancelPendingPromotionCode,
  useConsoleBillingCatalog,
  useConsolePendingPromotionCode,
  useConsolePromoRedeemPreflight,
  useConsoleSubscriptionDiscount,
  useRedeemAccessCode,
  useRedeemPromotionCode,
  useRemovePromoDiscount,
  useSavePendingPromotionCode,
} from '@virtality/react-query'
import { authClient } from '@/auth-client'
import { useConsoleBillingAuth } from '@/hooks/use-console-billing-auth'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import {
  BILLING_DISCOUNT_TIMING_COPY,
  billingCatalogMinor,
  billingCatalogPrices,
  buildBillingCompareAtCardDisplay,
  buildDiscountedBillingPriceLabels,
  isStaffRedeemBlocked,
  profileBillingDiscountDisplay,
  profileBillingOpensPortal,
  profileBillingPendingCancellationBanner,
  profileBillingPendingPlanChangeBanner,
  profileBillingPendingTargetInterval,
  profileBillingPrimaryCtaLabel,
  profileBillingShowsPlanCardCheckout,
  promoCodeLabel,
  profileBillingCardActionConfirm,
  resolveProfileBillingCardAction,
  type BillingInterval,
  type BillingStandingView,
  type ProfileBillingCardAction,
} from '@/lib/profile-billing'
import {
  CANCEL_SCHEDULE_RESTORE_TOAST,
  UNDO_CANCELLATION_RESTORE_TOAST,
} from '@/lib/console-better-auth-billing'
import { readCheckoutReturnIntent } from '@/lib/subscription-checkout'
import {
  formatAccessCodeAppliedMessage,
  isProfileBillingAccessCode,
  readAccessCodePrefill,
} from '@virtality/shared/utils'

const STANDING_REFETCH_ATTEMPTS = 5
const STANDING_REFETCH_DELAY_MS = 250

function redeemSuccessCopy(promotionCode: string, replaced: boolean): string {
  if (replaced) {
    return `Promotion Code ${promotionCode} applied (replaced previous discount). ${BILLING_DISCOUNT_TIMING_COPY}`
  }
  return `Promotion Code ${promotionCode} applied. ${BILLING_DISCOUNT_TIMING_COPY}`
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function readInitialClientSearch<T>(
  read: (search: string) => T,
  ssrFallback: T,
): T {
  if (typeof window === 'undefined') return ssrFallback
  return read(window.location.search)
}

export function useBillingTab() {
  const { data: session } = authClient.useSession()
  const standingQuery = useLiveEntitlementStanding()
  const catalogQuery = useConsoleBillingCatalog()
  const discountQuery = useConsoleSubscriptionDiscount()
  const pendingHoldQuery = useConsolePendingPromotionCode()
  const preflightQuery = useConsolePromoRedeemPreflight()
  const redeemMutation = useRedeemPromotionCode()
  const accessCodeMutation = useRedeemAccessCode()
  const savePendingMutation = useSavePendingPromotionCode()
  const cancelPendingMutation = useCancelPendingPromotionCode()
  const cancelPendingAsyncRef = useRef(cancelPendingMutation.mutateAsync)
  cancelPendingAsyncRef.current = cancelPendingMutation.mutateAsync
  const removeMutation = useRemovePromoDiscount()
  const {
    startCheckout,
    scheduleCycleChange,
    restore,
    openPortal,
    isScheduling,
    isRestoring,
    isOpeningPortal,
  } = useConsoleBillingAuth({
    plan: standingQuery.data?.plan,
    status: standingQuery.data?.status,
    hadPaidBilling: standingQuery.data?.hadPaidBilling,
  })

  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>('month')
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeSuccess, setRemoveSuccess] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState(() =>
    readInitialClientSearch(
      (search) => readAccessCodePrefill(search) ?? '',
      '',
    ),
  )
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<
    string | null
  >(null)
  const [planCardCheckoutPending, setPlanCardCheckoutPending] =
    useState<BillingInterval | null>(null)
  const [upgradeConfirmInterval, setUpgradeConfirmInterval] =
    useState<BillingInterval | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [initialCheckoutIntent] = useState(() =>
    readInitialClientSearch(readCheckoutReturnIntent, null),
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
    hasPendingPlanChange: standingQuery.data?.hasPendingPlanChange ?? false,
    cancelAtPeriodEnd: standingQuery.data?.cancelAtPeriodEnd ?? false,
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
  const planCardActionFor = (interval: BillingInterval) =>
    resolveProfileBillingCardAction(standing, hasStripeCustomer, interval)
  const pendingCancellationBanner =
    profileBillingPendingCancellationBanner(standing)
  const pendingPlanChangeBanner = pendingCancellationBanner
    ? null
    : profileBillingPendingPlanChangeBanner(standing)
  const upgradeConfirmCopy =
    upgradeConfirmInterval == null
      ? null
      : profileBillingCardActionConfirm(
          planCardActionFor(upgradeConfirmInterval),
        )
  const cancelTargetInterval = profileBillingPendingTargetInterval(standing)
  const cancelConfirmCopy =
    !cancelConfirmOpen || cancelTargetInterval == null
      ? null
      : profileBillingCardActionConfirm(planCardActionFor(cancelTargetInterval))
  const portalPending = isOpeningPortal
  const discount = discountQuery.data
  const display = profileBillingDiscountDisplay(discount, catalogMinor)
  const hasEligibleSubscription = preflightQuery.data?.ok === true
  const staffBlocked = discount ? isStaffRedeemBlocked(discount) : false
  const appliedPromoCode = discount ? promoCodeLabel(discount) : null
  const pendingHold = pendingHoldQuery.data ?? null
  const pendingHoldCode = pendingHold?.code ?? null
  const pendingHoldExpiresAt = pendingHold?.expiresAt ?? null
  const pendingHoldSuccessMessage = pendingHold
    ? `Promotion Code ${pendingHold.code} saved for Checkout. Finish subscribing within 2 minutes.`
    : null
  const promoSuccessBanner = redeemSuccessMessage ?? pendingHoldSuccessMessage

  useEffect(() => {
    if (initialCheckoutIntent !== 'cancel') return
    if (clearedCheckoutCancelRef.current) return
    clearedCheckoutCancelRef.current = true
    setRedeemSuccessMessage(null)
    void cancelPendingAsyncRef.current(undefined)
  }, [initialCheckoutIntent])

  async function savePendingPromotionCode(code: string) {
    await savePendingMutation.mutateAsync({ code })
    setRemoveSuccess(false)
    // Banner copy comes from the rehydrated open hold (and optimistic query seed).
    setRedeemSuccessMessage(null)
  }

  async function startCheckoutForInterval(interval: BillingInterval) {
    if (!hasEligibleSubscription && promoCode.trim()) {
      await savePendingPromotionCode(promoCode.trim())
      setPromoCode('')
    }
    await startCheckout({
      annual: interval === 'year',
    })
  }

  async function refetchStandingUntil(
    isReady: (data: typeof standingQuery.data) => boolean,
  ) {
    for (let attempt = 0; attempt < STANDING_REFETCH_ATTEMPTS; attempt += 1) {
      const refreshed = await standingQuery.refetch()
      if (isReady(refreshed.data)) break
      await new Promise((resolve) =>
        setTimeout(resolve, STANDING_REFETCH_DELAY_MS),
      )
    }
  }

  async function scheduleCycleChangeForInterval(interval: BillingInterval) {
    const result = await scheduleCycleChange({
      annual: interval === 'year',
    })
    if (result.ok) {
      // Schedule write is sync in Better Auth; refetch until Cancel can render.
      await refetchStandingUntil((data) => Boolean(data?.hasPendingPlanChange))
    }
  }

  async function handlePrimaryCta() {
    if (profileBillingOpensPortal(standing)) {
      await openPortal()
    }
  }

  function handlePlanCardCheckout(interval: BillingInterval) {
    setSelectedInterval(interval)
    const action: ProfileBillingCardAction = resolveProfileBillingCardAction(
      standing,
      hasStripeCustomer,
      interval,
    )
    switch (action.kind) {
      case 'restore_cancellation':
        void handleUndoCancellation()
        return
      case 'cancel_schedule':
        setCancelConfirmOpen(true)
        return
      case 'schedule':
        setUpgradeConfirmInterval(interval)
        return
      case 'checkout':
        void runPlanCardCheckout(interval)
        return
      case 'none':
        return
    }
  }

  async function runPlanCardCheckout(interval: BillingInterval) {
    setPlanCardCheckoutPending(interval)
    try {
      await startCheckoutForInterval(interval)
    } finally {
      setPlanCardCheckoutPending(null)
    }
  }

  async function handleUpgradeConfirm() {
    if (upgradeConfirmInterval == null) return
    const interval = upgradeConfirmInterval
    setUpgradeConfirmInterval(null)
    setPlanCardCheckoutPending(interval)
    try {
      await scheduleCycleChangeForInterval(interval)
    } finally {
      setPlanCardCheckoutPending(null)
    }
  }

  async function handleUndoCancellation() {
    setPlanCardCheckoutPending(standing.billingInterval)
    try {
      const result = await restore({
        successToast: UNDO_CANCELLATION_RESTORE_TOAST,
      })
      if (result.ok) {
        await refetchStandingUntil((data) => !data?.cancelAtPeriodEnd)
      }
    } finally {
      setPlanCardCheckoutPending(null)
    }
  }

  async function handleCancelConfirm() {
    setCancelConfirmOpen(false)
    setPlanCardCheckoutPending(
      standing.billingInterval === 'month' ? 'year' : 'month',
    )
    try {
      const result = await restore({
        successToast: CANCEL_SCHEDULE_RESTORE_TOAST,
      })
      if (result.ok) {
        await standingQuery.refetch()
      }
    } finally {
      setPlanCardCheckoutPending(null)
    }
  }

  async function handleRedeem(code: string, confirmReplace: boolean) {
    setRedeemError(null)
    setRedeemSuccessMessage(null)
    const trimmed = code.trim()
    if (!trimmed) return false

    if (isProfileBillingAccessCode(trimmed)) {
      try {
        const result = await accessCodeMutation.mutateAsync({ code: trimmed })
        setRemoveSuccess(false)
        setRedeemSuccessMessage(formatAccessCodeAppliedMessage(result))
        await refetchStandingUntil((data) => data != null)
        setPromoCode('')
        return true
      } catch (error) {
        setRedeemError(errorMessage(error, 'Could not apply that Access Code.'))
        return false
      }
    }

    try {
      if (!hasEligibleSubscription) {
        await savePendingPromotionCode(trimmed)
        setPromoCode('')
        return true
      }
      const result = await redeemMutation.mutateAsync({
        code: trimmed,
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

  async function handleCancelPendingHold() {
    setRedeemError(null)
    try {
      await cancelPendingMutation.mutateAsync(undefined)
      setRedeemSuccessMessage(null)
    } catch (error) {
      setRedeemError(
        errorMessage(error, 'Could not cancel that Promotion Code.'),
      )
    }
  }

  function handlePendingHoldExpired() {
    setRedeemSuccessMessage(null)
    void pendingHoldQuery.refetch()
  }

  const pendingDiscountPrices =
    pendingHold?.couponTerms && catalogMinor
      ? buildDiscountedBillingPriceLabels(pendingHold.couponTerms, catalogMinor)
      : null

  const liveDiscountPrices = display.kind === 'rewrite' ? display.prices : null

  const discountPrices = liveDiscountPrices ?? pendingDiscountPrices

  const cardDisplay =
    catalogQuery.data?.ok === true
      ? buildBillingCompareAtCardDisplay({
          assigned: catalogQuery.data.assigned.labels,
          basic: catalogQuery.data.basic.labels,
          showCompareAt: catalogQuery.data.showCompareAt,
          discountPrices,
        })
      : null

  return {
    isStandingPending: standingQuery.isPending,
    isCatalogPending: catalogQuery.isPending,
    isCatalogUnavailable: catalogQuery.data != null && !catalogQuery.data.ok,
    standing,
    selectedInterval,
    setSelectedInterval,
    prices,
    cardDisplay,
    display,
    removeSuccess,
    setRemoveSuccess,
    redeemSuccessMessage: promoSuccessBanner,
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
    redeeming:
      redeemMutation.isPending ||
      accessCodeMutation.isPending ||
      savePendingMutation.isPending,
    handlePrimaryCta,
    handlePlanCardCheckout,
    handleRedeem,
    handleRemoveConfirm,
    handleCancelPendingHold,
    handlePendingHoldExpired,
    cancelPendingPending: cancelPendingMutation.isPending,
    removeOpen,
    setRemoveOpen,
    appliedPromoCode,
    removePending: removeMutation.isPending,
    upgradeConfirmOpen: upgradeConfirmInterval != null,
    setUpgradeConfirmOpen: (open: boolean) => {
      if (!open) setUpgradeConfirmInterval(null)
    },
    upgradeConfirmCopy,
    handleUpgradeConfirm,
    upgradeConfirming: isScheduling,
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelConfirmCopy,
    handleCancelConfirm,
    cancelConfirming: isRestoring,
  }
}
