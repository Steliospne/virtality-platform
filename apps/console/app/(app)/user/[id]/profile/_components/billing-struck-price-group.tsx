'use client'

/**
 * Struck yearly price group (basic compare-at row).
 */

export function BillingStruckPriceGroup({
  lines,
}: {
  lines: { primary: string; secondary: string }
}) {
  return (
    <div className='space-y-0.5 text-zinc-400 tabular-nums line-through'>
      <p className='text-xl font-semibold sm:text-2xl'>{lines.primary}</p>
      <p className='text-sm'>{lines.secondary}</p>
    </div>
  )
}
