import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useScheduleConsoleCyclePlanChange() {
  const orpc = useORPC()
  return useMutation(
    orpc.consoleBilling.scheduleCyclePlanChange.mutationOptions(),
  )
}
