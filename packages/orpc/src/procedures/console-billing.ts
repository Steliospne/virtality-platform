import { readConsoleBillingCatalogAction } from '@virtality/auth'
import { authed } from '../middleware/auth.ts'

const readCatalog = authed
  .route({ path: '/console-billing/read-catalog', method: 'GET' })
  .handler(async () => readConsoleBillingCatalogAction())

export const consoleBilling = {
  readCatalog,
}
