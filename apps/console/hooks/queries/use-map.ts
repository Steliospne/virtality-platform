import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/integrations/orpc/client'

const useMap = () => {
  return useQuery(orpc.map.list.queryOptions({ staleTime: 'static' }))
}

export default useMap
