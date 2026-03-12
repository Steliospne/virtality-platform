import { redirect } from 'next/navigation'
import { getUserAndSession } from '@/lib/authActions'
import { authClient } from '@/auth-client'
import { headers } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, Key, UserIcon } from 'lucide-react'
import SessionsTab from './_components/sessions-tab'
import ProfileInfo from './_components/profile-info'

const ProfilePage = async () => {
  const data = await getUserAndSession()
  if (!data) redirect('/')

  const sessionList = await authClient.listSessions({
    fetchOptions: { headers: await headers() },
  })

  const { user, session } = data

  return (
    <div className='h-full dark:bg-zinc-950'>
      <div className='mx-auto max-w-3xl p-4'>
        <Tabs defaultValue='info'>
          <TabsList className='w-full gap-2'>
            <TabsTrigger value='info'>
              <UserIcon />
            </TabsTrigger>
            <TabsTrigger value='organizations'>
              <Building />
            </TabsTrigger>
            <TabsTrigger value='sessions'>
              <Key />
            </TabsTrigger>
          </TabsList>
          <TabsContent value='info'>
            <ProfileInfo user={user} />
          </TabsContent>
          <TabsContent value='organizations'>Organizations</TabsContent>
          <TabsContent value='sessions'>
            <SessionsTab
              sessions={sessionList.data ?? []}
              currentSessionToken={session.token}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProfilePage
