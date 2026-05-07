import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../../orpc-context.js'

export type SessionsPerDatePerUserInput =
  | {
      from: Date | string
      to: Date | string
      granularity: 'day' | 'week'
    }
  | undefined

export function usePatientSessionsPerDatePerUser(
  input: SessionsPerDatePerUserInput,
) {
  const orpc = useORPC()

  return useQuery(
    orpc.dashboard.getPatientSessionsPerDatePerUser.queryOptions({
      input: input
        ? {
            from: input.from,
            to: input.to,
            granularity: input.granularity,
          }
        : skipToken,
    }),
  )
}
