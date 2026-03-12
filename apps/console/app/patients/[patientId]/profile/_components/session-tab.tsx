'use client'

import { useState, useMemo } from 'react'
import { subDays } from 'date-fns'
import SessionsTable from './sessions-table'
import { SessionsOverview } from './sessions-overview'
import { usePatientSession, usePatientSessions } from '@virtality/react-query'
import SessionCard from './session-card'
import type { DateRangePreset } from '@/lib/session-metrics'
import { filterSessionsByDateRange } from '@/lib/session-metrics'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'

interface SessionTabProps {
  patientId: string
}

const DEFAULT_RANGE: DateRangePreset = 'month'
const DEFAULT_START = subDays(new Date(), 30)

export default function SessionTab({ patientId }: SessionTabProps) {
  usePageViewTracking({
    props: { route_group: 'patient', tab_view: 'patient-sessions' },
  })
  const [sessionViewing, setSessionViewing] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>(() => DEFAULT_START)
  const [rangePreset, setRangePreset] = useState<DateRangePreset>(DEFAULT_RANGE)

  const { data: session, isLoading } = usePatientSession({
    sessionId: sessionViewing,
  })

  const { data: allSessions } = usePatientSessions({
    input: {
      where: {
        patientId,
        AND: [{ deletedAt: null }, { completedAt: { not: null } }],
      },
    },
  })

  const filteredSessions = useMemo(() => {
    if (!allSessions?.length) return []
    return filterSessionsByDateRange(allSessions, startDate, rangePreset)
  }, [allSessions, startDate, rangePreset])

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center py-12'>
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>
          Loading session…
        </p>
      </div>
    )
  }

  if (sessionViewing !== '' && session) {
    return (
      <SessionCard
        session={session}
        patientId={patientId}
        onBack={setSessionViewing}
      />
    )
  }

  if (sessionViewing !== '' && !session) {
    return (
      <div className='rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/40'>
        <p className='text-zinc-600 dark:text-zinc-400'>Session not found.</p>
        <button
          type='button'
          onClick={() => setSessionViewing('')}
          className='mt-2 text-sm font-medium text-teal-600 hover:underline dark:text-teal-400'
        >
          Back to list
        </button>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-8'>
      <SessionsOverview
        sessions={allSessions ?? []}
        startDate={startDate}
        rangePreset={rangePreset}
        onStartDateChange={setStartDate}
        onRangePresetChange={setRangePreset}
      />
      <div className='flex flex-1 flex-col'>
        <SessionsTable
          patientId={patientId}
          onSessionSelect={setSessionViewing}
          sessions={filteredSessions}
        />
      </div>
    </div>
  )
}
