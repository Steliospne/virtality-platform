'use client'

/**
 * Inline amounts with a single trailing interval (catalog / discount / struck).
 */

export type InlinePricePartTone = 'catalog' | 'discounted' | 'struck'

export type InlinePricePart = {
  amount: string
  tone: InlinePricePartTone
}

const PRIMARY_AMOUNT: Record<InlinePricePartTone, string> = {
  catalog: 'text-xl font-semibold tabular-nums sm:text-2xl',
  discounted:
    'text-xl font-semibold text-emerald-700 tabular-nums sm:text-2xl dark:text-emerald-300',
  struck:
    'text-xl font-semibold text-zinc-400 tabular-nums line-through sm:text-2xl',
}

const SECONDARY_AMOUNT: Record<InlinePricePartTone, string> = {
  catalog: 'text-sm text-zinc-400 tabular-nums',
  discounted: 'text-sm text-emerald-600 tabular-nums dark:text-emerald-400',
  struck: 'text-sm text-zinc-400 tabular-nums line-through',
}

const INTERVAL_PRIMARY =
  'text-xl font-semibold text-zinc-500 tabular-nums sm:text-2xl'
const INTERVAL_SECONDARY = 'text-sm text-zinc-400 tabular-nums'

export function BillingInlinePriceLine({
  parts,
  interval,
  size = 'primary',
}: {
  parts: InlinePricePart[]
  interval: string
  size?: 'primary' | 'secondary'
}) {
  const amountClass = size === 'primary' ? PRIMARY_AMOUNT : SECONDARY_AMOUNT
  const intervalClass =
    size === 'primary' ? INTERVAL_PRIMARY : INTERVAL_SECONDARY

  return (
    <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
      {parts.map((part, index) => (
        <span key={`${part.tone}-${index}`} className={amountClass[part.tone]}>
          {part.amount}
        </span>
      ))}
      {interval ? <span className={intervalClass}>{interval}</span> : null}
    </div>
  )
}
