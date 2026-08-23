import { CustomerProfileField } from '@/components/customer/customer-profile-field'
import { CustomerProfileSection } from '@/components/customer/customer-profile-section'
import {
  formatCustomerAccessStatus,
  formatCustomerBillingStatus,
} from '@/lib/admin-customer-display'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileIdentityProps = {
  profile: AdminCustomerProfile
}

export function CustomerProfileIdentity({
  profile,
}: CustomerProfileIdentityProps) {
  return (
    <CustomerProfileSection title='Identity'>
      <CustomerProfileField label='Name'>{profile.name}</CustomerProfileField>
      <CustomerProfileField label='Email'>{profile.email}</CustomerProfileField>
      <CustomerProfileField label='Role'>
        {profile.role ?? 'user'}
      </CustomerProfileField>
      <CustomerProfileField label='User id' valueClassName='font-mono text-xs'>
        {profile.userId}
      </CustomerProfileField>
      <CustomerProfileField label='Access'>
        {formatCustomerAccessStatus(profile.accessStatus)}
      </CustomerProfileField>
      <CustomerProfileField label='Billing'>
        {formatCustomerBillingStatus(profile.billingStatus)}
      </CustomerProfileField>
    </CustomerProfileSection>
  )
}
