import type { AdminCustomerProfile } from '@virtality/shared/utils'
import { ExternalLink } from 'lucide-react'

type CustomerProfileStripeLinksProps = {
  profile: AdminCustomerProfile
}

type StripeDashboardLink = {
  label: string
  href: string
}

function buildStripeDashboardLinks(
  stripeLinks: AdminCustomerProfile['stripeLinks'],
): StripeDashboardLink[] {
  return [
    {
      label: 'Stripe customer',
      href: stripeLinks.customerUrl,
    },
    {
      label: 'Primary subscription',
      href: stripeLinks.primarySubscriptionUrl,
    },
  ].filter((link): link is StripeDashboardLink => link.href != null)
}

export function CustomerProfileStripeLinks({
  profile,
}: CustomerProfileStripeLinksProps) {
  const links = buildStripeDashboardLinks(profile.stripeLinks)

  return (
    <section className='grid gap-3'>
      <h3 className='text-lg font-semibold'>Stripe links</h3>
      {links.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No Stripe customer or subscription links available.
        </p>
      ) : (
        <ul className='grid gap-2 text-sm'>
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target='_blank'
                rel='noreferrer'
                className='text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline'
              >
                {link.label}
                <ExternalLink className='size-3.5' />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
