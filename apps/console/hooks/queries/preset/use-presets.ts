import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const usePresets = () => {
  return useQuery(orpc.preset.list.queryOptions({ staleTime: 'static' }))
}

export default usePresets
