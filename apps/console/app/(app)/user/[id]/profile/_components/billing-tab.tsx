'use client'

/**
 * Profile → Billing: stacked Monthly/Yearly Pro cards + Checkout / Portal CTA.
 */

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import { authClient } from '@/auth-client'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { useSubscriptionBillingPortal } from '@/hooks/use-subscription-billing-portal'
import { useSubscriptionCheckout } from '@/hooks/use-subscription-checkout'
import { cn } from '@/lib/utils'
import {
  PRO_BILLING_PRICES,
  profileBillingOpensPortal,
  profileBillingPrimaryCtaLabel,
  profileBillingStatusDetail,
  profileBillingStatusHeadline,
  type BillingInterval,
  type BillingStandingView,
} from '@/lib/profile-billing'

function PlanCard({
  title,
  description,
  selected,
  disabled,
  onSelect,
  pricePrimary,
  priceMuted,
  badge,
}: {
  title: string
  description: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
  pricePrimary: string
  priceMuted?: string
  badge?: string
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-xl border-2 p-5 text-left transition',
        selected
          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800',
        disabled && 'opacity-60',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-lg font-semibold'>{title}</p>
            {badge ? <Badge>{badge}</Badge> : null}
          </div>
          <p className='mt-1 text-sm text-zinc-500'>{description}</p>
        </div>
        <div className='text-right'>
          <p className='text-lg font-semibold tabular-nums'>{pricePrimary}</p>
          {priceMuted ? (
            <p className='mt-0.5 text-sm text-zinc-400 tabular-nums'>
              {priceMuted}
            </p>
          ) : null}
        </div>
      </div>
      {selected ? (
        <p className='mt-3 flex items-center gap-1.5 text-sm font-medium'>
          <Check className='size-4' /> Selected
        </p>
      ) : null}
    </button>
  )
}

export function BillingTab() {
  const { data: session } = authClient.useSession()
  const standingQuery = useLiveEntitlementStanding()
  const { startCheckout, isStarting: isCheckoutStarting } =
    useSubscriptionCheckout()
  const { startPortal, isStarting: isPortalStarting } =
    useSubscriptionBillingPortal()

  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>('month')

  const prices = PRO_BILLING_PRICES
  const entitled = standingQuery.entitled
  const standing: BillingStandingView = {
    entitled,
    status: standingQuery.data?.status ?? null,
    billingPathEstablished: standingQuery.data?.billingPathEstablished ?? false,
    hadPaidBilling: standingQuery.data?.hadPaidBilling ?? false,
    billingInterval: standingQuery.data?.billingInterval ?? null,
    clockEnd: standingQuery.data?.clockEnd ?? null,
  }

  useEffect(() => {
    if (standing.billingInterval) {
      setSelectedInterval(standing.billingInterval)
    }
  }, [standing.billingInterval])

  const hasStripeCustomer = Boolean(
    (session?.user as { stripeCustomerId?: string | null } | undefined)
      ?.stripeCustomerId,
  )
  const cta = profileBillingPrimaryCtaLabel(standing, hasStripeCustomer)
  const ctaPending = isCheckoutStarting || isPortalStarting

  async function handlePrimaryCta() {
    if (profileBillingOpensPortal(standing)) {
      await startPortal()
      return
    }
    await startCheckout({ annual: selectedInterval === 'year' })
  }

  if (standingQuery.isPending) {
    return <p className='text-sm text-zinc-500'>Loading billing…</p>
  }

  return (
    <div className='rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
            Billing
          </p>
          <h2 className='text-2xl font-semibold tracking-tight'>
            {profileBillingStatusHeadline(standing)}
          </h2>
          <p className='text-sm text-zinc-500'>
            {profileBillingStatusDetail(standing)}
          </p>
        </header>

        <div className='grid gap-3'>
          <PlanCard
            title='Monthly'
            description='Flexible. Cancel anytime before renewal.'
            selected={selectedInterval === 'month'}
            disabled={entitled}
            onSelect={() => setSelectedInterval('month')}
            pricePrimary={prices.monthlyLabel}
          />
          <PlanCard
            title='Yearly'
            description='One payment. Same Pro access for twelve months.'
            selected={selectedInterval === 'year'}
            disabled={entitled}
            onSelect={() => setSelectedInterval('year')}
            pricePrimary={prices.yearlyAsMonthlyLabel}
            priceMuted={prices.yearlyTotalMutedLabel}
            badge={prices.yearlySavingsLabel}
          />
        </div>

        {cta ? (
          <Button
            type='button'
            variant='primary'
            className='w-full'
            size='lg'
            disabled={ctaPending}
            onClick={() => {
              void handlePrimaryCta()
            }}
          >
            {ctaPending
              ? profileBillingOpensPortal(standing)
                ? 'Opening portal…'
                : 'Starting Checkout…'
              : cta}
          </Button>
        ) : (
          <p className='text-center text-sm text-zinc-500'>
            Billing is unavailable until a Stripe Customer is linked to this
            account.
          </p>
        )}
      </div>
    </div>
  )
}
