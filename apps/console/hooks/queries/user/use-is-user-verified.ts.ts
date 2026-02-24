import { orpc } from '@/integrations/orpc/client'
import { skipToken, useQuery } from '@tanstack/react-query'

const useIsUserVerified = ({ email }: { email: string | null }) => {
  return useQuery(
    orpc.user.isUserVerified.queryOptions({
      input: email ? { email } : skipToken,
    }),
  )
}

export default useIsUserVerified
