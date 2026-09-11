import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EntitlementStanding } from '@virtality/shared/utils'
import { useORPC } from '../../../orpc-context.js'

export function useMarkTrialWelcomeSeen() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.entitlementClock.markTrialWelcomeSeen.mutationOptions({
      onSuccess: async () => {
        const standingKey = orpc.entitlementClock.getStanding.key()
        // The welcome page renders outside the app shell, so the standing
        // query has no observers here and a plain invalidate would leave the
        // stale `needsTrialWelcome: true` in cache for the next shell mount
        // (which would bounce the clinician back to the welcome page).
        queryClient.setQueryData<EntitlementStanding>(standingKey, (prev) =>
          prev ? { ...prev, needsTrialWelcome: false } : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: standingKey,
          refetchType: 'all',
        })
      },
    }),
  )
}
