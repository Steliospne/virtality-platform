'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type UpdatePresetOnSuccess = ReturnType<
  typeof orpc.preset.update.mutationOptions
>['onSuccess']

interface useUpdatePresetProps {
  onSuccess?: UpdatePresetOnSuccess
}

const useUpdatePreset = ({ onSuccess }: useUpdatePresetProps) => {
  return useMutation(orpc.preset.update.mutationOptions({ onSuccess }))
}

export default useUpdatePreset
