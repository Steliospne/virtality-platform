import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

function useInvalidateAdminCustomerQueries() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: orpc.adminCustomer.list.key(),
    })
    queryClient.invalidateQueries({
      queryKey: orpc.adminCustomer.getProfile.key(),
    })
  }
}

export function useAssignPermanentAccessGate() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.assignPermanentAccessGate.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useSetAccessGateTrial() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.setAccessGateTrial.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useRevokeAccessGate() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.revokeAccessGate.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}
