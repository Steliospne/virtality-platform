import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

interface UseRecentPatientSessionsProps {
  since: Date
}

export function useRecentPatientSessions({
  since,
}: UseRecentPatientSessionsProps) {
  const orpc = useORPC()
  return useQuery(
    orpc.patientSession.listRecent.queryOptions({ input: { since } }),
  )
}
