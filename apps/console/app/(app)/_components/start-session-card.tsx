'use client'

import { Play } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Skeleton } from '@/components/ui/skeleton'
import { START_SESSION_ANCHOR } from '@/lib/home-getting-started'
import type { HomeDashboardData } from './use-home-dashboard-data'
import { useStartSessionPicker } from './use-start-session-picker'
import StartSessionPatientStep from './start-session-patient-step'
import StartSessionProgramStep from './start-session-program-step'
import StartSessionHeadsetStep from './start-session-headset-step'

const StartSessionCard = ({ data }: { data: HomeDashboardData }) => {
  const picker = useStartSessionPicker(data)
  const { pickerSummary, canLaunch, launch } = picker

  return (
    <section
      id={START_SESSION_ANCHOR}
      className='bg-card text-card-foreground flex scroll-mt-20 flex-col gap-5 rounded-xl border p-6 shadow-sm'
    >
      <div>
        <h2 className='text-base font-semibold'>Start a session</h2>
        <p className='text-muted-foreground text-sm'>
          Pick a patient, a program, and a headset.
        </p>
      </div>

      {data.isLoading ? (
        <div className='grid gap-4 lg:grid-cols-3'>
          <Skeleton className='h-62' />
          <Skeleton className='h-62' />
          <Skeleton className='h-62' />
        </div>
      ) : (
        <div className='grid gap-4 lg:grid-cols-3'>
          <StartSessionPatientStep patients={data.patients} picker={picker} />
          <StartSessionProgramStep programs={data.programs} picker={picker} />
          <StartSessionHeadsetStep
            devices={data.devices}
            presenceById={data.presenceById}
            picker={picker}
          />
        </div>
      )}

      <div className='flex flex-wrap items-center justify-between gap-4 border-t pt-5'>
        <p className='text-muted-foreground text-[13px]' aria-live='polite'>
          {pickerSummary.chosen.join(' · ')}
          {pickerSummary.missing ? (
            <>
              {pickerSummary.chosen.length ? ' · ' : ''}
              <b className='text-foreground font-medium'>
                {pickerSummary.missing}
              </b>
            </>
          ) : null}
        </p>
        <Button
          variant='primary'
          size='lg'
          disabled={!canLaunch}
          onClick={launch}
        >
          <Play className='fill-current' />
          Continue to launch
        </Button>
      </div>
    </section>
  )
}

export default StartSessionCard
