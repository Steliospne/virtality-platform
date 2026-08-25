'use client'

import { Button } from '@/components/ui/button'
import {
  formatCustomerAccessStatus,
  formatCustomerBillingStatus,
  formatCustomerEntitlementSummary,
  formatCustomerInitials,
} from '@/lib/admin-customer-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type CustomerProfileRailProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileRail({ profile }: CustomerProfileRailProps) {
  return (
    <aside className='border-border bg-muted/30 lg:sticky lg:top-0 lg:h-[calc(100svh-4rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-r'>
      <div className='space-y-6 p-6'>
        <Button asChild variant='ghost' size='sm' className='-ml-2'>
          <Link href='/customers'>
            <ArrowLeft className='size-4' />
            Customers
          </Link>
        </Button>

        <div className='flex items-start gap-4'>
          <div className='flex size-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'>
            {formatCustomerInitials(profile.name)}
          </div>
          <div className='min-w-0'>
            <h1 className='text-xl font-semibold tracking-tight'>
              {profile.name}
            </h1>
            <p className='text-muted-foreground truncate text-sm'>
              {profile.email}
            </p>
          </div>
        </div>

        <dl className='grid gap-3 text-sm'>
          <div>
            <dt className='text-muted-foreground'>Access</dt>
            <dd className='font-medium'>
              {formatCustomerAccessStatus(profile.accessStatus)}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Billing</dt>
            <dd className='font-medium'>
              {formatCustomerBillingStatus(profile.billingStatus)}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Entitlement clock</dt>
            <dd className='font-medium'>
              {formatCustomerEntitlementSummary(profile.entitlement)}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>VR launch</dt>
            <dd className='font-medium'>
              {profile.entitlement.canLaunchVr ? 'Allowed' : 'Blocked'}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Role</dt>
            <dd className='font-medium'>{profile.role ?? 'user'}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>User id</dt>
            <dd className='font-mono text-xs break-all'>{profile.userId}</dd>
          </div>
        </dl>

        <div className='space-y-2 border-t pt-4'>
          <p className='text-sm font-medium'>Stripe</p>
          {profile.stripeLinks.customerUrl ? (
            <a
              href={profile.stripeLinks.customerUrl}
              target='_blank'
              rel='noreferrer'
              className='text-primary flex items-center gap-1 text-sm underline-offset-4 hover:underline'
            >
              Customer <ExternalLink className='size-3.5' />
            </a>
          ) : null}
          {profile.stripeLinks.primarySubscriptionUrl ? (
            <a
              href={profile.stripeLinks.primarySubscriptionUrl}
              target='_blank'
              rel='noreferrer'
              className='text-primary flex items-center gap-1 text-sm underline-offset-4 hover:underline'
            >
              Subscription <ExternalLink className='size-3.5' />
            </a>
          ) : null}
          {!profile.stripeLinks.customerUrl &&
          !profile.stripeLinks.primarySubscriptionUrl ? (
            <p className='text-muted-foreground text-sm'>
              No Stripe links available.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
