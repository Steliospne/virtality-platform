import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PreviewChangePaidPlanInput } from '@virtality/shared/types'
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

export function usePreviewChangePaidPlan(input: {
  userId: string
  targetPriceId: PreviewChangePaidPlanInput['targetPriceId']
  enabled?: boolean
}) {
  const orpc = useORPC()

  return useQuery({
    ...orpc.adminCustomer.previewChangePaidPlan.queryOptions({
      input: {
        userId: input.userId,
        targetPriceId: input.targetPriceId,
      },
    }),
    enabled: input.enabled ?? false,
  })
}

export function useChangePaidPlan() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.changePaidPlan.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useCancelPaidSubscription() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.cancelPaidSubscription.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useReactivatePaidSubscription() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.reactivatePaidSubscription.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useAssignFreeAfterCancellation() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.assignFreeAfterCancellation.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useSendPaidCheckoutLink() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.sendPaidCheckoutLink.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}
