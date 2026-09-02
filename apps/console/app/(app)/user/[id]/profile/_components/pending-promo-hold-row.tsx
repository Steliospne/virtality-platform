'use client'

/**
 * Open Checkout hold for a Promotion Code (pre-subscribe). Cancel clears the hold.
 */

import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import { formatPendingHoldCountdown } from '@/lib/pending-hold-countdown'
import { usePendingHoldCountdown } from '@/lib/use-pending-hold-countdown'

export function PendingPromoHoldRow({
  code,
  expiresAt,
  canceling,
  onCancel,
  onExpired,
}: {
  code: string
  expiresAt: Date | string
  canceling: boolean
  onCancel: () => void
  onExpired?: () => void
}) {
  const remainingMs = usePendingHoldCountdown(expiresAt, onExpired)

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='secondary' className='font-mono'>
          {code}
        </Badge>
        <span className='text-sm text-zinc-600 dark:text-zinc-400'>
          Saved for Checkout
        </span>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <span
          className='font-mono text-sm text-zinc-600 tabular-nums dark:text-zinc-400'
          aria-label='Time left to finish Checkout'
        >
          {formatPendingHoldCountdown(remainingMs)}
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={canceling}
          onClick={onCancel}
        >
          {canceling ? 'Canceling…' : 'Cancel'}
        </Button>
      </div>
    </div>
  )
}
