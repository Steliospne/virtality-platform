import Organizations from '@/components/organization/Organizations'
import { getUser } from '@/lib/authActions'
import { prisma } from '@virtality/db'

const OrganizationsPage = async () => {
  const user = await getUser()

  if (!user) return

  const userOrganizations = await prisma.organization.findMany({
    where: { members: { some: { userId: user.id } } },
  })

  return <Organizations userOrganizations={userOrganizations} />
}

export default OrganizationsPage
