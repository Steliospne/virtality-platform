'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type DeletePresetOnSuccess = ReturnType<
  typeof orpc.preset.delete.mutationOptions
>['onSuccess']

interface useDeletePresetProps {
  onSuccess?: DeletePresetOnSuccess
}

const useDeletePreset = ({ onSuccess }: useDeletePresetProps) => {
  return useMutation(orpc.preset.delete.mutationOptions({ onSuccess }))
}

export default useDeletePreset
