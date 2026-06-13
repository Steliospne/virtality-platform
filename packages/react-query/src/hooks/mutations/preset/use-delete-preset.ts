import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type DeletePresetOnSuccess = ReturnType<
  ORPCUtils['legacy']['preset']['delete']['mutationOptions']
>['onSuccess']

interface UseDeletePresetProps {
  onSuccess?: DeletePresetOnSuccess
}

export function useDeletePreset({ onSuccess }: UseDeletePresetProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.legacy.preset.delete.mutationOptions({ onSuccess }))
}
