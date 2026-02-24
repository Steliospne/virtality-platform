import { orpc } from '@/integrations/orpc/client'
import { useMutation } from '@tanstack/react-query'

type SetDeviceIdOnSuccess = ReturnType<
  typeof orpc.device.setDeviceId.mutationOptions
>['onSuccess']

interface useSetDeviceIdProps {
  onSuccess?: SetDeviceIdOnSuccess
}

const useSetDeviceId = ({ onSuccess }: useSetDeviceIdProps) => {
  return useMutation(orpc.device.setDeviceId.mutationOptions({ onSuccess }))
}

export default useSetDeviceId
