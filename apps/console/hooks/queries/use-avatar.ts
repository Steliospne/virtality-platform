import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const useAvatar = () => {
  return useQuery(orpc.avatar.list.queryOptions({ staleTime: 'static' }))
}

export default useAvatar
