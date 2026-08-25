import { CustomerProfilePage } from '@/components/customer/customer-profile-page'

export const dynamic = 'force-dynamic'

type CustomerProfileRouteProps = {
  params: Promise<{ userId: string }>
}

export default async function CustomerProfileRoute({
  params,
}: CustomerProfileRouteProps) {
  const { userId } = await params
  return <CustomerProfilePage userId={userId} />
}
