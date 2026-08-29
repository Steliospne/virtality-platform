'use client'

/**
 * Catalog yearly price group (monthly-equivalent + yearly total).
 */

export function BillingCatalogYearlyPriceGroup({
  lines,
}: {
  lines: { primary: string; secondary: string }
}) {
  return (
    <div className='space-y-0.5'>
      <p className='text-xl font-semibold tabular-nums sm:text-2xl'>
        {lines.primary}
      </p>
      <p className='text-sm text-zinc-400 tabular-nums'>{lines.secondary}</p>
    </div>
  )
}
