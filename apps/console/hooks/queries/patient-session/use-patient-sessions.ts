'use client'

import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'
import { PatientSessionFindManyArgs } from '@virtality/db'

interface usePatientSessionsProps {
  input: PatientSessionFindManyArgs
}

const usePatientSessions = ({ input }: usePatientSessionsProps) => {
  return useQuery(orpc.patientSession.list.queryOptions({ input }))
}

export default usePatientSessions
