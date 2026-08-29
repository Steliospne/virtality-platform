import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useAssignableProVariants(enabled = true) {
  const orpc = useORPC()
  return useQuery({
    ...orpc.adminCustomer.listAssignableProVariants.queryOptions({
      input: {},
    }),
    enabled,
    staleTime: 60_000,
  })
}

export function useAssignProVariant() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.assignProVariant.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}
