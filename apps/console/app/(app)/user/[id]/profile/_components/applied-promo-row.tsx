'use client'

/**
 * Applied Promotion Code row with remove Discount action.
 */

import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import { formatPendingHoldCountdown } from '@/lib/pending-hold-countdown'
import { usePendingHoldCountdown } from '@/lib/use-pending-hold-countdown'

export function AppliedPromoRow({
  appliedCode,
  expiresAt,
  onRemove,
  onExpired,
}: {
  appliedCode: string | null
  /** Reverts automatically at this time unless removed sooner (2-minute TTL). */
  expiresAt?: Date | string | null
  onRemove: () => void
  onExpired?: () => void
}) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='secondary' className='font-mono'>
          {appliedCode ?? 'Applied'}
        </Badge>
        <span className='text-sm text-zinc-600 dark:text-zinc-400'>
          Promotion Code on your subscription
        </span>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {expiresAt != null ? (
          <AppliedPromoCountdown expiresAt={expiresAt} onExpired={onExpired} />
        ) : null}
        <Button type='button' variant='outline' size='sm' onClick={onRemove}>
          Remove discount
        </Button>
      </div>
    </div>
  )
}

function AppliedPromoCountdown({
  expiresAt,
  onExpired,
}: {
  expiresAt: Date | string
  onExpired?: () => void
}) {
  const remainingMs = usePendingHoldCountdown(expiresAt, onExpired)
  return (
    <span
      className='font-mono text-sm text-zinc-600 tabular-nums dark:text-zinc-400'
      aria-label='Time left before this Discount reverts automatically'
    >
      {formatPendingHoldCountdown(remainingMs)}
    </span>
  )
}
