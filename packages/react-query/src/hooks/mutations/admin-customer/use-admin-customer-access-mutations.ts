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

export function useAssignPermanentFree() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.assignPermanentFree.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useGrantTimedTrial() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.grantTimedTrial.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useIssueTrialGrant() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.issueTrialGrant.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useStartTrialGrant() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.startTrialGrant.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useAdjustTrialGrant() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.adjustTrialGrant.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}

export function useRevokeTrialGrant() {
  const orpc = useORPC()
  const invalidate = useInvalidateAdminCustomerQueries()

  return useMutation(
    orpc.adminCustomer.revokeTrialGrant.mutationOptions({
      onSuccess: invalidate,
    }),
  )
}
