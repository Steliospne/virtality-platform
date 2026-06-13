import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type UpdatePresetOnSuccess = ReturnType<
  ORPCUtils['legacy']['preset']['update']['mutationOptions']
>['onSuccess']

interface UseUpdatePresetProps {
  onSuccess?: UpdatePresetOnSuccess
}

export function useUpdatePreset({ onSuccess }: UseUpdatePresetProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.legacy.preset.update.mutationOptions({ onSuccess }))
}
