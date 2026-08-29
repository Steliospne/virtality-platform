'use client'

/**
 * Redeem, replace, or remove a Promotion Code on the billing tab.
 */

import { useState, type ReactNode } from 'react'
import type { SubscriptionDiscountRead } from '@virtality/shared/utils'
import {
  STAFF_REDEEM_BLOCK_COPY,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
} from '@/lib/profile-billing'
import {
  resolvePromoRedeemChrome,
  type PromoRedeemChrome,
} from '@/lib/promo-redeem-chrome'
import { AppliedPromoRow } from './applied-promo-row'
import { PendingPromoHoldRow } from './pending-promo-hold-row'
import { PromoCodeEntryForm } from './promo-code-entry-form'
import { RedeemReplaceConfirmDialog } from './redeem-replace-confirm-dialog'

function promoRedeemBody({
  chrome,
  pendingHoldExpiresAt,
  onRemoveLive,
  onCancelPending,
  onPendingExpired,
  cancelPendingPending,
  successFlash,
  redeemError,
  redeeming,
  code,
  onCodeChange,
  onApply,
}: {
  chrome: PromoRedeemChrome
  pendingHoldExpiresAt: Date | string | null
  onRemoveLive: () => void
  onCancelPending: () => void
  onPendingExpired: () => void
  cancelPendingPending: boolean
  successFlash: boolean
  redeemError: string | null
  redeeming: boolean
  code: string
  onCodeChange: (value: string) => void
  onApply: () => void
}): ReactNode {
  switch (chrome.kind) {
    case 'pending_hold':
      return pendingHoldExpiresAt == null ? null : (
        <PendingPromoHoldRow
          code={chrome.code}
          expiresAt={pendingHoldExpiresAt}
          canceling={cancelPendingPending}
          onCancel={onCancelPending}
          onExpired={onPendingExpired}
        />
      )
    case 'checking_discount':
      return <p className='text-sm text-zinc-500'>Checking current discount…</p>
    case 'redeem_unavailable':
      return (
        <p className='text-sm text-zinc-500'>
          Promotion Code redeem is unavailable until discount details load. Try
          again shortly.
        </p>
      )
    case 'staff_blocked':
      return <p className='text-sm text-zinc-500'>{STAFF_REDEEM_BLOCK_COPY}</p>
    case 'applied_live':
      return (
        <AppliedPromoRow appliedCode={chrome.code} onRemove={onRemoveLive} />
      )
    case 'entry':
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
}

export function PromoRedeemSection({
  discount,
  hasEligibleSubscription,
  pendingHoldCode,
  pendingHoldExpiresAt,
  staffBlocked,
  onRemove,
  onCancelPending,
  onPendingExpired,
  cancelPendingPending,
  successFlash,
  redeemError,
  onRedeem,
  redeeming,
  code,
  onCodeChange,
}: {
  discount: SubscriptionDiscountRead | undefined
  hasEligibleSubscription: boolean
  pendingHoldCode: string | null
  pendingHoldExpiresAt: Date | string | null
  staffBlocked: boolean
  onRemove: () => void
  onCancelPending: () => void
  onPendingExpired: () => void
  cancelPendingPending: boolean
  successFlash: boolean
  redeemError: string | null
  onRedeem: (code: string, confirmReplace: boolean) => Promise<boolean>
  redeeming: boolean
  code: string
  onCodeChange: (value: string) => void
}) {
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const chrome = resolvePromoRedeemChrome({
    hasEligibleSubscription,
    pendingHoldCode,
    discount,
    staffBlocked,
  })
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
        chrome,
        pendingHoldExpiresAt,
        onRemoveLive: onRemove,
        onCancelPending,
        onPendingExpired,
        cancelPendingPending,
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
