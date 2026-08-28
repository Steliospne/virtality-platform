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

  const startCheckout = async (options?: { annual?: boolean }) => {
    if (isStartingCheckout) {
      return {
        ok: false as const,
        message: 'Checkout already starting',
      }
    }

    setIsStartingCheckout(true)
    try {
      const result = await billing.startCheckout({
        returnUrl: currentConsoleReturnUrl(),
        annual: options?.annual,
      })
      return notifyConsoleBillingAuthResult(result, {
        toastError: toast.error,
        toastSuccess: toast.success,
      })
    } finally {
      setIsStartingCheckout(false)
    }
  }

  const scheduleCycleChange = async (options: { annual: boolean }) => {
    if (isScheduling) {
      return {
        ok: false as const,
        message: 'Plan change already scheduling',
      }
    }

    setIsScheduling(true)
    try {
      const result = await billing.scheduleCycleChange({
        returnUrl: currentConsoleReturnUrl(),
        annual: options.annual,
      })
      return notifyConsoleBillingAuthResult(result, {
        successToast: CYCLE_PLAN_CHANGE_SCHEDULED_TOAST,
        toastError: toast.error,
        toastSuccess: toast.success,
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const restore = async (options?: {
    successMessage?: string
  }): Promise<ConsoleBetterAuthBillingResult> => {
    if (isRestoring)
      return { ok: false, message: 'Restore already in progress' }

    setIsRestoring(true)
    try {
      const result = await billing.restore()
      return notifyConsoleBillingAuthResult(result, {
        successToast: options?.successMessage,
        toastError: toast.error,
        toastSuccess: toast.success,
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const openPortal = async () => {
    if (isOpeningPortal) {
      return { ok: false as const, message: 'Portal already opening' }
    }

    setIsOpeningPortal(true)
    try {
      const result = await billing.openPortal({
        returnUrl: currentConsoleReturnUrl(),
      })
      return notifyConsoleBillingAuthResult(result, {
        toastError: toast.error,
        toastSuccess: toast.success,
      })
    } finally {
      setIsOpeningPortal(false)
    }
  }

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
