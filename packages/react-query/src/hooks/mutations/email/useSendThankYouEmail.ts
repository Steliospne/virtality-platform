import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export const useSendThankYouEmail = () => {
  const orpc = useORPC()
  return useMutation(orpc.email.sendThankYouEmail.mutationOptions())
}
