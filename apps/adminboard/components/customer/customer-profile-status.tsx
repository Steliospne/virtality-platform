import { CustomerProfileField } from '@/components/customer/customer-profile-field'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import { formatCustomerEntitlementSummary } from '@/lib/admin-customer-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileStatusProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileStatus({ profile }: CustomerProfileStatusProps) {
  const { entitlement } = profile

  return (
    <CustomerProfileSection title='Entitlement Clock'>
      <CustomerProfileField label='Clock'>
        {formatCustomerEntitlementSummary(entitlement)}
      </CustomerProfileField>
      <CustomerProfileField label='VR launch'>
        {entitlement.canLaunchVr ? 'Allowed' : 'Blocked'}
      </CustomerProfileField>
      <CustomerProfileField label='Billing path'>
        {entitlement.billingPathEstablished ? 'Established' : 'Not established'}
      </CustomerProfileField>
    </CustomerProfileSection>
  )
}
