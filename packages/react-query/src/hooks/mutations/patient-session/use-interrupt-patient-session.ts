import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type InterruptSessionOnSuccess = ReturnType<
  ORPCUtils['patientSession']['interrupt']['mutationOptions']
>['onSuccess']

interface UseInterruptPatientSessionProps {
  onSuccess?: InterruptSessionOnSuccess
}

export function useInterruptPatientSession({
  onSuccess,
}: UseInterruptPatientSessionProps = {}) {
  const orpc = useORPC()
  return useMutation(
    orpc.patientSession.interrupt.mutationOptions({ onSuccess }),
  )
}
