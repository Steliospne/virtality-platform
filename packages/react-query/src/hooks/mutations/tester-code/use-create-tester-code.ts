import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreateTesterCode() {
  const orpc = useORPC()
  return useMutation(orpc.testerCode.create.mutationOptions())
}
