'use client'

import { useState } from 'react'
import SessionsTable from '../_components/sessions-table'
import usePatientSession from '@/hooks/queries/patient-session/use-patient-session'
import SessionCard from '../_components/session-card'

interface SessionTabProps {
  patientId: string
}

const SessionTab = ({ patientId }: SessionTabProps) => {
  const [sessionViewing, setSessionViewing] = useState<string>('')

  const { data: session, isLoading } = usePatientSession({
    sessionId: sessionViewing,
  })

  return sessionViewing === '' ? (
    <SessionsTable patientId={patientId} onSessionSelect={setSessionViewing} />
  ) : isLoading ? (
    <div>Loading...</div>
  ) : (
    <SessionCard
      session={session}
      patientId={patientId}
      onBack={setSessionViewing}
    />
  )
}

export default SessionTab
