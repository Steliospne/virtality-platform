'use client'

/**
 * Unified Promotion or Access Code input and apply control for the billing tab.
 */

import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'

export function PromoCodeEntryForm({
  code,
  onCodeChange,
  redeeming,
  redeemError,
  successFlash,
  onApply,
  applyLabel,
  fieldLabel,
}: {
  code: string
  onCodeChange: (value: string) => void
  redeeming: boolean
  redeemError: string | null
  successFlash: boolean
  onApply: () => void
  applyLabel?: string
  fieldLabel?: string
}) {
  return (
    <>
      {successFlash ? (
        <p className='text-sm text-emerald-700 dark:text-emerald-300'>
          You can enter a new code below when ready.
        </p>
      ) : null}
      <div className='flex gap-2'>
        <Input
          value={code}
          onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
          placeholder='Enter code'
          className='font-mono'
          aria-label={fieldLabel ?? 'Promotion or Access Code'}
          disabled={redeeming}
        />
        <Button
          type='button'
          variant='outline'
          disabled={!code.trim() || redeeming}
          onClick={onApply}
        >
          {redeeming ? 'Applying…' : (applyLabel ?? 'Apply')}
        </Button>
      </div>
      {redeemError ? (
        <p className='text-sm text-red-600 dark:text-red-400'>{redeemError}</p>
      ) : null}
    </>
  )
}
