import {
  formatCustomerPlanLabel,
  formatCustomerSubscriptionDate,
} from '@/lib/admin-customer-display'
import { useAssignablePlanVariants } from '@virtality/react-query'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import startCase from 'lodash.startcase'

type CustomerProfileSubscriptionsProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileSubscriptions({
  profile,
}: CustomerProfileSubscriptionsProps) {
  const variantsQuery = useAssignablePlanVariants()
  const productName = variantsQuery.data?.productName

  return (
    <section className='grid gap-3'>
      <h3 className='text-lg font-semibold'>Subscription history</h3>
      {profile.subscriptionHistory.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No subscriptions synced.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left'>
              <tr>
                <th className='px-3 py-2 font-medium'>Plan</th>
                <th className='px-3 py-2 font-medium'>Status</th>
                <th className='px-3 py-2 font-medium'>Interval</th>
                <th className='px-3 py-2 font-medium'>Trial end</th>
                <th className='px-3 py-2 font-medium'>Period end</th>
                <th className='px-3 py-2 font-medium'>Stripe sub</th>
              </tr>
            </thead>
            <tbody>
              {profile.subscriptionHistory.map((subscription) => (
                <tr key={subscription.id} className='border-t'>
                  <td className='px-3 py-2'>
                    {formatCustomerPlanLabel(subscription.plan, productName)}
                  </td>
                  <td className='px-3 py-2'>
                    {startCase(subscription.status)}
                  </td>
                  <td className='px-3 py-2'>
                    {subscription.billingInterval ?? '-'}
                  </td>
                  <td className='px-3 py-2'>
                    {formatCustomerSubscriptionDate(subscription.trialEnd)}
                  </td>
                  <td className='px-3 py-2'>
                    {formatCustomerSubscriptionDate(subscription.periodEnd)}
                  </td>
                  <td className='px-3 py-2 font-mono text-xs'>
                    {subscription.stripeSubscriptionId ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
