'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CompleteSessionOnSuccess = ReturnType<
  typeof orpc.patientSession.complete.mutationOptions
>['onSuccess']

interface useCompleteSessionProps {
  onSuccess?: CompleteSessionOnSuccess
}

const useCompleteSession = ({ onSuccess }: useCompleteSessionProps) => {
  return useMutation(
    orpc.patientSession.complete.mutationOptions({ onSuccess }),
  )
}

export default useCompleteSession
