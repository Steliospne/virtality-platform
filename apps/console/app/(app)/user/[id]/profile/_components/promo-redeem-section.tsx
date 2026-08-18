'use client'

/**
 * Redeem, replace, or remove a Promotion Code on the billing tab.
 */

import { useState, type ReactNode } from 'react'
import type { SubscriptionDiscountRead } from '@virtality/shared/utils'
import {
  STAFF_REDEEM_BLOCK_COPY,
  canRemovePromoDiscount,
  promoCodeLabel,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
} from '@/lib/profile-billing'
import { AppliedPromoRow } from './applied-promo-row'
import { PromoCodeEntryForm } from './promo-code-entry-form'
import { RedeemReplaceConfirmDialog } from './redeem-replace-confirm-dialog'

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

export function PromoRedeemSection({
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
