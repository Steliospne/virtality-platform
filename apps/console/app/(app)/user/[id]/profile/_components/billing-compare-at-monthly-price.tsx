'use client'

/**
 * Monthly compare-at rows: catalog, inline discount, struck basic.
 */

import type { BillingCompareAtMonthlyRow } from '@/lib/profile-billing'
import { BillingCatalogMonthlyPrice } from './billing-catalog-monthly-price'
import { BillingInlinePriceLine } from './billing-inline-price-line'
import { BillingStruckMonthlyPrice } from './billing-struck-monthly-price'

export function BillingCompareAtMonthlyPrice({
  rows,
}: {
  rows: BillingCompareAtMonthlyRow[]
}) {
  return (
    <div className='space-y-3'>
      {rows.map((row, index) => {
        switch (row.kind) {
          case 'catalog':
            return (
              <BillingCatalogMonthlyPrice
                key={`catalog-${index}`}
                price={row.price}
              />
            )
          case 'discount-inline':
            return (
              <BillingInlinePriceLine
                key={`discount-${index}`}
                parts={[
                  { amount: row.line.discounted, tone: 'discounted' },
                  { amount: row.line.current, tone: 'struck' },
                ]}
                interval={row.line.interval}
              />
            )
          case 'struck':
            return (
              <BillingStruckMonthlyPrice
                key={`struck-${index}`}
                price={row.price}
              />
            )
        }
      })}
    </div>
  )
}
