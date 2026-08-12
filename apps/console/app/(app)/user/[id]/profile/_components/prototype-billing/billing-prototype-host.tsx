'use client'

/**
 * PROTOTYPE ONLY: Profile Billing host.
 * Three variants of Profile → Billing, switchable via ?variant=A|B|C.
 * Scenario picker exercises tester→paid and renew states.
 * Variants share one functional model; Checkout is stubbed via the real
 * buildProCheckoutUpgradeInput shape (no Stripe redirect).
 */

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PrototypeSwitcher } from '@/components/prototype/prototype-switcher'
import { buildProCheckoutUpgradeInput } from '@/lib/subscription-checkout'
import {
  formatPrototypeBillingState,
  PROTOTYPE_BILLING_PRICES,
  PROTOTYPE_BILLING_SCENARIOS,
  type PrototypeBillingInterval,
  type PrototypeBillingScenarioId,
} from './prototype-billing-model'
import {
  VARIANT_A_META,
  VariantAStackedPlanCards,
} from './variant-a-stacked-plan-cards'
import {
  VARIANT_B_META,
  VariantBSplitStatusInterval,
} from './variant-b-split-status-interval'
import {
  VARIANT_C_META,
  VariantCCompactReceiptRow,
} from './variant-c-compact-receipt-row'

const VARIANTS = [VARIANT_A_META, VARIANT_B_META, VARIANT_C_META] as const

const SCENARIO_IDS = Object.keys(
  PROTOTYPE_BILLING_SCENARIOS,
) as PrototypeBillingScenarioId[]

function BillingPrototypeInner() {
  const searchParams = useSearchParams()
  const variantKey = searchParams.get('variant') ?? 'A'

  const [scenarioId, setScenarioId] = useState<PrototypeBillingScenarioId>(
    'tester_never_entitled',
  )
  const [selectedInterval, setSelectedInterval] =
    useState<PrototypeBillingInterval>('month')
  const [lastAction, setLastAction] = useState<string | null>(null)

  const standing = PROTOTYPE_BILLING_SCENARIOS[scenarioId].standing

  const stateDump = useMemo(
    () =>
      formatPrototypeBillingState({
        scenarioId,
        variant: variantKey,
        selectedInterval,
        lastAction,
        standing,
      }),
    [scenarioId, variantKey, selectedInterval, lastAction, standing],
  )

  function handleCheckout() {
    const upgradeInput = buildProCheckoutUpgradeInput(
      '/user/prototype/profile?tab=billing',
      { annual: selectedInterval === 'year' },
    )
    setLastAction(`Stub: subscription.upgrade(${JSON.stringify(upgradeInput)})`)
  }

  const shared = {
    standing,
    prices: PROTOTYPE_BILLING_PRICES,
    selectedInterval,
    onSelectInterval: (interval: PrototypeBillingInterval) => {
      setSelectedInterval(interval)
      setLastAction(`Selected interval: ${interval}`)
    },
    onCheckout: handleCheckout,
    lastAction,
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-md border border-dashed border-amber-400/70 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'>
        <p className='font-semibold'>PROTOTYPE: Profile Billing</p>
        <p className='mt-0.5'>
          Throwaway UI for Monthly/Yearly Pro conversion. Checkout stubbed with
          real upgrade params (no Stripe). Switch variants with the amber bar or
          ← →.
        </p>
      </div>

      <label className='flex flex-col gap-1 text-xs'>
        <span className='font-medium text-zinc-500'>Scenario</span>
        <select
          className='h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950'
          value={scenarioId}
          onChange={(event) => {
            const next = event.target.value as PrototypeBillingScenarioId
            setScenarioId(next)
            setLastAction(
              `Scenario: ${PROTOTYPE_BILLING_SCENARIOS[next].label}`,
            )
            const interval = PROTOTYPE_BILLING_SCENARIOS[next].standing.interval
            if (interval) setSelectedInterval(interval)
          }}
        >
          {SCENARIO_IDS.map((id) => (
            <option key={id} value={id}>
              {PROTOTYPE_BILLING_SCENARIOS[id].label}
            </option>
          ))}
        </select>
      </label>

      <div className='rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950'>
        {variantKey === 'B' ? (
          <VariantBSplitStatusInterval {...shared} />
        ): variantKey === 'C' ? (
          <VariantCCompactReceiptRow {...shared} />
        ): (
          <VariantAStackedPlanCards {...shared} />
        )}
      </div>

      <details className='rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900'>
        <summary className='cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-300'>
          Prototype state
        </summary>
        <pre className='mt-2 overflow-x-auto text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300'>
          {stateDump}
        </pre>
      </details>

      <PrototypeSwitcher variants={VARIANTS} />
    </div>
  )
}

export function BillingPrototypeHost() {
  return (
    <Suspense
      fallback={
        <p className='text-sm text-zinc-500'>Loading billing prototype…</p>
      }
    >
      <BillingPrototypeInner />
    </Suspense>
  )
}
