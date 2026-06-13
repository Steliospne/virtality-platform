import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type UpsertPatientSessionDataOnSuccess = ReturnType<
  ORPCUtils['patientSessionData']['upsertMany']['mutationOptions']
>['onSuccess']

interface UseUpsertPatientSessionDataProps {
  onSuccess?: UpsertPatientSessionDataOnSuccess
}

export function useUpsertPatientSessionData({
  onSuccess,
}: UseUpsertPatientSessionDataProps = {}) {
  const orpc = useORPC()
  return useMutation(
    orpc.patientSessionData.upsertMany.mutationOptions({ onSuccess }),
  )
}
