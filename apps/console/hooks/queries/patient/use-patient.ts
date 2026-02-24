import { orpc } from '@/integrations/orpc/client'
import { skipToken, useQuery } from '@tanstack/react-query'

interface usePatientProps {
  patientId?: string
}

const usePatient = ({ patientId }: usePatientProps) => {
  return useQuery(
    orpc.patient.find.queryOptions({
      input: patientId ? { id: patientId } : skipToken,
    }),
  )
}

export default usePatient
