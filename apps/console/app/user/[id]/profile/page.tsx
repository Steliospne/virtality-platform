import UserProfile from '@/app/(pages)/user/user-profile/user-profile'
import { redirect } from 'next/navigation'
import { getUserAndSession } from '@/lib/authActions'
import { authClient, Session } from '@/auth-client'
import { headers } from 'next/headers'

const ProfilePage = async () => {
  const data = await getUserAndSession()
  if (!data) redirect('/')

  const sessionList = await authClient.listSessions({
    fetchOptions: { headers: await headers() },
  })

  const { user, session } = data

  return (
    <UserProfile
      user={user}
      session={session}
      sessions={(sessionList.data as Session[]) ?? []}
    />
  )
}

export default ProfilePage
