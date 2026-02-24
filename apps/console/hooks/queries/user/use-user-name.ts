import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const useUserName = () => {
  return useQuery(orpc.user.findUserName.queryOptions())
}

export default useUserName
