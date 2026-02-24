import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/integrations/orpc/client'

interface usePatientProgramProps {
  id: string
}

const usePatientProgram = ({ id }: usePatientProgramProps) => {
  return useQuery(orpc.program.find.queryOptions({ input: { id } }))
}

export default usePatientProgram
