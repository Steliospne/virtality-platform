'use client'

import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

interface usePatientSessionsProps {
  patientId: string
}

const usePatientSessions = ({ patientId }: usePatientSessionsProps) => {
  return useQuery(
    orpc.patientSession.list.queryOptions({ input: { where: { patientId } } }),
  )
}

export default usePatientSessions
