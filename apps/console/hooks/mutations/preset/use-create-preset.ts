'use client'

import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type CreatePresetOnSuccess = ReturnType<
  typeof orpc.preset.create.mutationOptions
>['onSuccess']

interface useCreatePresetProps {
  onSuccess?: CreatePresetOnSuccess
}

const useCreatePreset = ({ onSuccess }: useCreatePresetProps) => {
  return useMutation(orpc.preset.create.mutationOptions({ onSuccess }))
}

export default useCreatePreset
