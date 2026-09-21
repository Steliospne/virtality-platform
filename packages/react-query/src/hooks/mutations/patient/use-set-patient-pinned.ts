import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useSetPatientPinned() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.patient.setPinned.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.patient.list.key() })
      },
    }),
  )
}
