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
import { useScheduleConsoleCyclePlanChange } from '@virtality/react-query'

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
 * Console Profile Billing → Better Auth via one adapter for Checkout / restore /
 * portal. Cycle plan change uses orpc so Assigned Variant Price ids are charged.
 */
export function useConsoleBillingAuth() {
  const scheduleCycleMutation = useScheduleConsoleCyclePlanChange()

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
      async () => {
        try {
          await scheduleCycleMutation.mutateAsync({ annual: options.annual })
          return { ok: true }
        } catch (error) {
          return {
            ok: false as const,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to schedule plan change',
          }
        }
      },
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
