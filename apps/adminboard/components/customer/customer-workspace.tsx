'use client'

import { CustomerTable } from '@/components/customer/customer-table'

export function CustomerWorkspace() {
  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Customers</h1>
        <p className='text-muted-foreground mt-2 max-w-3xl'>
          Every non-deleted Console user with separate Access and Billing
          status. Open a row to review identity, Entitlement Clock, subscription
          history, and billing administration.
        </p>
      </div>

      <CustomerTable />
    </div>
  )
}
