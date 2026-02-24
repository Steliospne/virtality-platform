import { orpc } from '@/integrations/orpc/client'
import { skipToken, useQuery } from '@tanstack/react-query'

interface usePatientProgramsProps {
  patientId?: string
}

const usePatientPrograms = ({ patientId }: usePatientProgramsProps) => {
  return useQuery(
    orpc.program.list.queryOptions({
      input: patientId ? { patientId } : skipToken,
    }),
  )
}

export default usePatientPrograms
