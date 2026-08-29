import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useStartConsoleSubscribeCheckout() {
  const orpc = useORPC()
  return useMutation(
    orpc.consoleBilling.startSubscribeCheckout.mutationOptions(),
  )
}
