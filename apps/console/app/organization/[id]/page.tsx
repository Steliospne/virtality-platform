import OrganizationProfile from '@/components/organization/OrganizationProfile'
import { prisma } from '@virtality/db'
import { getUserAndSession } from '@/lib/authActions'

const OrganizationProfilePage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params

  const session = await getUserAndSession()
  if (!session) return

  const organization = await prisma.organization.findFirst({
    where: { id },
    include: { members: { include: { user: true } } },
  })

  if (!organization) return
  return (
    <OrganizationProfile
      session={session.session}
      organization={organization}
    />
  )
}

export default OrganizationProfilePage
