import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

interface UsePatientProgramsProps {
  patientId?: string
}

export function usePatientPrograms({ patientId }: UsePatientProgramsProps) {
  const orpc = useORPC()
  return useQuery(
    orpc.legacy.program.list.queryOptions({
      input: patientId ? { patientId } : skipToken,
    }),
  )
}
