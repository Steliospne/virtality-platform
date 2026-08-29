'use client'

/**
 * Struck monthly catalog price (basic compare-at row).
 */

export function BillingStruckMonthlyPrice({ price }: { price: string }) {
  return (
    <p className='text-xl font-semibold text-zinc-400 tabular-nums line-through sm:text-2xl'>
      {price}
    </p>
  )
}
