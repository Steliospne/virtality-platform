import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type ResetDeviceIdOnSuccess = ReturnType<
  typeof orpc.device.resetDeviceId.mutationOptions
>['onSuccess']

interface useResetDeviceIdProps {
  onSuccess?: ResetDeviceIdOnSuccess
}

const useResetDeviceId = ({ onSuccess }: useResetDeviceIdProps) => {
  return useMutation(orpc.device.resetDeviceId.mutationOptions({ onSuccess }))
}

export default useResetDeviceId
