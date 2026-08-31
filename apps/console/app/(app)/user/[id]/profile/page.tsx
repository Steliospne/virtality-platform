import { Suspense } from 'react'
import { authClient } from '@/auth-client'
import { headers as getHeaders } from 'next/headers'
import SessionsTab from './_components/sessions-tab'
import ProfileInfo from './_components/profile-info'
import { BillingTab } from './_components/billing-tab'
import { ProfileTabs } from './_components/profile-tabs'
import { ProfileSkeleton } from './_components/profile-skeleton'
import { redirect } from 'next/navigation'
import {
  buildPathAndQuery,
  buildSignInHref,
  type NextSearchParams,
} from '@/lib/sign-in-redirect'
import { ACCOUNT_MISMATCH_REDIRECT } from '@/lib/account-mismatch'

type ProfilePageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<NextSearchParams>
}

const ProfilePage = async ({ params, searchParams }: ProfilePageProps) => {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const tabParam = resolvedSearchParams.tab
  const tab = Array.isArray(tabParam) ? tabParam[0] : tabParam
  const headers = await getHeaders()

  const { data: sessionData } = await authClient.getSession({
    fetchOptions: { headers },
  })

  if (!sessionData) {
    redirect(
      buildSignInHref(
        buildPathAndQuery(`/user/${id}/profile`, resolvedSearchParams),
      ),
    )
  }

  const { user, session } = sessionData

  if (user.id !== id) {
    redirect(ACCOUNT_MISMATCH_REDIRECT)
  }

  const { data: sessionList } = await authClient.listSessions({
    fetchOptions: { headers },
  })

  return (
    <div className='h-full dark:bg-zinc-950'>
      <div className='mx-auto max-w-3xl p-4'>
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileTabs
            requestedTab={tab}
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
