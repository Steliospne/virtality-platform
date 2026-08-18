'use client'

/**
 * Applied Promotion Code row with remove Discount action.
 */

import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'

export function AppliedPromoRow({
  appliedCode,
  onRemove,
}: {
  appliedCode: string | null
  onRemove: () => void
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
      <Button type='button' variant='outline' size='sm' onClick={onRemove}>
        Remove discount
      </Button>
    </div>
  )
}
