import UserProfileNavBar from '@/components/ui/tab-bar'
import { getUserAndSession } from '@/lib/authActions'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getUserAndSession()
  return (
    <>
      <UserProfileNavBar
        linkObject={[
          {
            textContext: 'Back',
            href: `/user/${session?.user.id}/organizations`,
          },
        ]}
      />
      <div>{children}</div>
    </>
  )
}
