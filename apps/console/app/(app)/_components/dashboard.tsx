'use client'

import { useMemo } from 'react'
import useIsAuthed from '@/hooks/use-is-authed'
import useMounted from '@/hooks/use-mounted'
import AdminTool from './admin-tool'
import AccountMismatchDialog from './account-mismatch-dialog'
import HomeHeader from './home-header'
import SessionsOverviewCard from './sessions-overview-card'
import StartSessionCard from './start-session-card'
import PinnedPatientsCard from './pinned-patients-card'
import GettingStartedCard from './getting-started-card'
import { useHomeDashboardData } from './use-home-dashboard-data'

const Dashboard = ({ isImpersonating }: { isImpersonating?: boolean }) => {
  const { data, isPending } = useIsAuthed()
  const mounted = useMounted()
  // One clock for the whole page so every card agrees on "today".
  const now = useMemo(() => new Date(), [])
  const home = useHomeDashboardData(now)

  return (
    <section className='min-h-screen-with-header relative flex flex-col gap-6 p-6 lg:p-10'>
      <AccountMismatchDialog />
      <AdminTool isImpersonating={isImpersonating} />

      <HomeHeader
        name={data?.user.name}
        now={now}
        isPending={isPending || !mounted}
      />
      <SessionsOverviewCard summary={home.summary} isLoading={home.isLoading} />
      <StartSessionCard data={home} />
      <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'>
        <PinnedPatientsCard
          patients={home.patients}
          isLoading={home.isLoading}
        />
        {home.isLoading ? null : (
          <GettingStartedCard gettingStarted={home.gettingStarted} />
        )}
      </div>
    </section>
  )
}

export default Dashboard
