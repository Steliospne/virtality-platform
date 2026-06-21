import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type SyncSessionWorkingCopyOnSuccess = ReturnType<
  ORPCUtils['patientSession']['syncWorkingCopy']['mutationOptions']
>['onSuccess']

interface UseSyncSessionWorkingCopyProps {
  onSuccess?: SyncSessionWorkingCopyOnSuccess
}

export function useSyncSessionWorkingCopy({
  onSuccess,
}: UseSyncSessionWorkingCopyProps = {}) {
  const orpc = useORPC()
  return useMutation(
    orpc.patientSession.syncWorkingCopy.mutationOptions({ onSuccess }),
  )
}
