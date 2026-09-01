import { Suspense } from 'react'
import { CheckoutSuccessPage } from './_components/checkout-success-page'

export default function BillingSuccessRoute() {
  return (
    <Suspense>
      <CheckoutSuccessPage />
    </Suspense>
  )
}
