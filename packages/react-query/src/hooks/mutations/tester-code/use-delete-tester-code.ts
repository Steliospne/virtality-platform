import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type DeleteTesterCodeOnSuccess = ReturnType<
  ORPCUtils['testerCode']['delete']['mutationOptions']
>['onSuccess']

interface UseDeleteTesterCodeProps {
  onSuccess?: DeleteTesterCodeOnSuccess
}

export function useDeleteTesterCode({
  onSuccess,
}: UseDeleteTesterCodeProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.testerCode.delete.mutationOptions({ onSuccess }))
}
