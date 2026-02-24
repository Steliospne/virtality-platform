'use client'
import ExerciseList from './_components/exercise-list'
import ControlPanel from './_components/control-panel'
import ChartCard from './_components/chart-card'
import SessionDialog from './_components/session-dialog'
import QuickStartDialog from './_components/quickstart-dialog'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import { Button } from '@/components/ui/button'
import { AreaChart, List } from 'lucide-react'
import { useState } from 'react'
import SessionNotesCard from './_components/session-notes-card'
import useIsAuthed from '@/hooks/use-is-authed'

const PatientDashboard = () => {
  useIsAuthed()
  const [visibleFeature, setVisibleFeature] = useState<'notes' | 'chart'>(
    'notes',
  )

  const featureToggleHandler = () => {
    if (visibleFeature === 'chart') setVisibleFeature('notes')
    else setVisibleFeature('chart')
  }

  return (
    <div className='h-screen-with-nav flex justify-center'>
      <div className='container grid grid-cols-12 grid-rows-[repeat(30,24px)] gap-5 p-8'>
        {/* INFO PANEL */}
        <div className='bg-card col-start-4 -col-end-1 row-span-2 row-start-1 rounded-xl border p-4 shadow max-xl:col-start-1'>
          <ControlPanel />
        </div>

        <ExerciseList className='col-span-3 col-start-1 row-span-18 row-start-1 max-xl:col-span-full max-xl:col-start-1 max-xl:row-span-8 max-xl:row-start-14 lg:max-xl:row-start-18' />
        <div className='relative col-span-full col-start-4 row-span-16 row-start-3 max-xl:col-start-1 max-lg:row-span-11 lg:max-xl:row-end-18'>
          <Button
            size='icon'
            onClick={featureToggleHandler}
            className='absolute top-4 right-4'
          >
            {visibleFeature === 'notes' ? <List /> : <AreaChart />}
          </Button>

          {visibleFeature === 'notes' ? <ChartCard /> : <SessionNotesCard />}
        </div>

        <SessionDialog />
        <ExerciseLibraryProvider>
          <QuickStartDialog />
        </ExerciseLibraryProvider>
      </div>
    </div>
  )
}

export default PatientDashboard
