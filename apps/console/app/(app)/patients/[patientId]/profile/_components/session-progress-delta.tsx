'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Change in average progress vs the previous session; hidden below half a point. */
const SessionProgressDelta = ({ deltaPct }: { deltaPct: number | null }) => {
  if (deltaPct == null || Math.abs(deltaPct) < 0.5) return null

  const improved = deltaPct > 0
  const Icon = improved ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs',
        improved
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
      )}
      title={`${improved ? '+' : ''}${deltaPct.toFixed(1)} points vs previous session`}
    >
      <Icon className='size-3.5' />
      {Math.abs(deltaPct).toFixed(0)}
    </span>
  )
}

export default SessionProgressDelta
