import { Suspense } from 'react'
import { authClient } from '@/auth-client'
import { headers as getHeaders } from 'next/headers'
import SessionsTab from './_components/sessions-tab'
import ProfileInfo from './_components/profile-info'
import { BillingTab } from './_components/billing-tab'
import { ProfileTabs } from './_components/profile-tabs'
import { redirect } from 'next/navigation'

const ProfilePage = async () => {
  const headers = await getHeaders()

  const { data: sessionData } = await authClient.getSession({
    fetchOptions: { headers },
  })

  if (!sessionData) redirect('/sign-in')

  const { data: sessionList } = await authClient.listSessions({
    fetchOptions: { headers },
  })

  const { user, session } = sessionData

  return (
    <div className='h-full dark:bg-zinc-950'>
      <div className='mx-auto max-w-3xl p-4'>
        <Suspense
          fallback={<p className='text-sm text-zinc-500'>Loading profile…</p>}
        >
          <ProfileTabs
            info={<ProfileInfo user={user} />}
            billing={<BillingTab />}
            sessions={
              <SessionsTab
                sessions={sessionList ?? []}
                currentSessionToken={session.token}
              />
            }
          />
        </Suspense>
      </div>
    </div>
  )
}

export default ProfilePage
