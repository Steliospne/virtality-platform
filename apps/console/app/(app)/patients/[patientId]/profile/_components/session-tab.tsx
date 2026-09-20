'use client'

import { useState, useMemo } from 'react'
import SessionsTable from './sessions-table'
import { SessionsOverview } from './sessions-overview'
import { usePatientSession, usePatientSessions } from '@virtality/react-query'
import SessionCard from './session-card'
import { filterSessionsByDateRange } from '@/lib/session-date-range'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { usePatientSessionDateRange } from '@/hooks/use-patient-session-date-range'

interface SessionTabProps {
  patientId: string
}

export default function SessionTab({ patientId }: SessionTabProps) {
  usePageViewTracking({
    props: { route_group: 'patient', tab_view: 'patient-sessions' },
  })
  const [sessionViewing, setSessionViewing] = useState<string>('')
  const { startDate, endDate, setStartDate, setEndDate, applyPreset } =
    usePatientSessionDateRange(patientId)

  const { data: session, isLoading: isSessionLoading } = usePatientSession({
    sessionId: sessionViewing || undefined,
  })

  const { data: allSessions, isPending: isSessionsPending } =
    usePatientSessions({
      input: {
        where: {
          patientId,
          AND: [
            { deletedAt: null },
            { status: { in: ['COMPLETED', 'INTERRUPTED'] } },
          ],
        },
      },
    })

  const clinicalHistorySessions = allSessions ?? []

  const filteredSessions = useMemo(() => {
    if (!clinicalHistorySessions.length) return []
    return filterSessionsByDateRange(clinicalHistorySessions, {
      startDate,
      endDate,
    })
  }, [clinicalHistorySessions, startDate, endDate])

  if (sessionViewing && isSessionLoading) {
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
        sessions={clinicalHistorySessions}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPresetSelect={applyPreset}
      />
      <div className='flex flex-1 flex-col'>
        <SessionsTable
          patientId={patientId}
          onSessionSelect={setSessionViewing}
          sessions={filteredSessions}
          historySessions={clinicalHistorySessions}
          isLoading={isSessionsPending}
        />
      </div>
    </div>
  )
}
