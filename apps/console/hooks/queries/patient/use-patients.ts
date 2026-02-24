import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'
import { PatientFindManyZodSchema } from '@virtality/db/definitions'
import { z } from 'zod'

type defaultInput = z.infer<typeof PatientFindManyZodSchema>

const usePatients = (input?: defaultInput) => {
  return useQuery(orpc.patient.list.queryOptions({ input: { ...input } }))
}

export default usePatients
