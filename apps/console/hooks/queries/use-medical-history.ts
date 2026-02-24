'use client'
import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const useMedicalHistory = ({ patientId }: { patientId: string }) => {
  return useQuery(
    orpc.medicalHistory.find.queryOptions({
      input: { where: { patientId: patientId } },
    }),
  )
}

export default useMedicalHistory
