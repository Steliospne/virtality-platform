import { useMutation } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type CreatePresetOnSuccess = ReturnType<
  ORPCUtils['legacy']['preset']['create']['mutationOptions']
>['onSuccess']

interface UseCreatePresetProps {
  onSuccess?: CreatePresetOnSuccess
}

export function useCreatePreset({ onSuccess }: UseCreatePresetProps = {}) {
  const orpc = useORPC()
  return useMutation(orpc.legacy.preset.create.mutationOptions({ onSuccess }))
}
