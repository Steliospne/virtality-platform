import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

interface UsePatientProgramProps {
  id: string
}

export function usePatientProgram({ id }: UsePatientProgramProps) {
  const orpc = useORPC()
  return useQuery(orpc.legacy.program.find.queryOptions({ input: { id } }))
}
