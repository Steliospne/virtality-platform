import { useQuery } from '@tanstack/react-query'
import { PatientFindManyZodSchema } from '@virtality/db/definitions'
import type { z } from 'zod'
import { useORPC } from '../../../orpc-context.js'

type PatientFindManyInput = z.infer<typeof PatientFindManyZodSchema>

export interface UsePatientsInput extends Partial<PatientFindManyInput> {
  listAll?: boolean
}

export function usePatients(input?: UsePatientsInput) {
  const orpc = useORPC()
  return useQuery(orpc.patient.list.queryOptions({ input: { ...input } }))
}
