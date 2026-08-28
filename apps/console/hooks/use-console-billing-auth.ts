'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import {
  CYCLE_PLAN_CHANGE_SCHEDULED_TOAST,
  createConsoleBetterAuthBilling,
  notifyConsoleBillingAuthResult,
  type ConsoleBetterAuthBillingResult,
} from '@/lib/console-better-auth-billing'

function currentConsoleReturnUrl(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`
}

type ToastNotifyOptions = {
  successToast?: string
}

/**
 * Runs a billing action once: rejects re-entry while pending, then applies
 * shared error / optional success toasts.
 */
async function runBillingAction(
  isPending: boolean,
  setPending: (pending: boolean) => void,
  busyMessage: string,
  action: () => Promise<ConsoleBetterAuthBillingResult>,
  notify?: ToastNotifyOptions,
): Promise<ConsoleBetterAuthBillingResult> {
  if (isPending) {
    return { ok: false, message: busyMessage }
  }

  setPending(true)
  try {
    const result = await action()
    return notifyConsoleBillingAuthResult(result, {
      successToast: notify?.successToast,
      toastError: toast.error,
      toastSuccess: toast.success,
    })
  } finally {
    setPending(false)
  }
}

/**
 * Console Profile Billing → Better Auth via one adapter. Owns toasts and
 * pending flags for Checkout, Cycle schedule, restore, and Customer Portal.
 */
export function useConsoleBillingAuth() {
  const billing = useMemo(
    () =>
      createConsoleBetterAuthBilling({
        upgrade: (input) => authClient.subscription.upgrade(input),
        restore: (input) => authClient.subscription.restore(input),
        billingPortal: (input) => authClient.subscription.billingPortal(input),
      }),
    [],
  )

  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  const startCheckout = async (options?: { annual?: boolean }) =>
    runBillingAction(
      isStartingCheckout,
      setIsStartingCheckout,
      'Checkout already starting',
      () =>
        billing.startCheckout({
          returnUrl: currentConsoleReturnUrl(),
          annual: options?.annual,
        }),
    )

  const scheduleCycleChange = async (options: { annual: boolean }) =>
    runBillingAction(
      isScheduling,
      setIsScheduling,
      'Plan change already scheduling',
      () =>
        billing.scheduleCycleChange({
          returnUrl: currentConsoleReturnUrl(),
          annual: options.annual,
        }),
      { successToast: CYCLE_PLAN_CHANGE_SCHEDULED_TOAST },
    )

  const restore = async (options?: {
    successToast?: string
  }): Promise<ConsoleBetterAuthBillingResult> =>
    runBillingAction(
      isRestoring,
      setIsRestoring,
      'Restore already in progress',
      () => billing.restore(),
      { successToast: options?.successToast },
    )

  const openPortal = async () =>
    runBillingAction(
      isOpeningPortal,
      setIsOpeningPortal,
      'Portal already opening',
      () =>
        billing.openPortal({
          returnUrl: currentConsoleReturnUrl(),
        }),
    )

  return {
    startCheckout,
    scheduleCycleChange,
    restore,
    openPortal,
    isStartingCheckout,
    isScheduling,
    isRestoring,
    isOpeningPortal,
  }
}
