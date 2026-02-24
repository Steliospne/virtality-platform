'use client'

import { skipToken, useQuery } from '@tanstack/react-query'
import { orpc } from '@/integrations/orpc/client'

interface usePatientSessionProps {
  sessionId?: string
}

const usePatientSession = ({ sessionId }: usePatientSessionProps) => {
  return useQuery(
    orpc.patientSession.find.queryOptions({
      input:
        sessionId || sessionId !== ''
          ? { where: { id: sessionId } }
          : skipToken,
    }),
  )
}

export default usePatientSession
