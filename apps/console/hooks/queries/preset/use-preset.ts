import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const usePreset = ({ id }: { id: string }) => {
  return useQuery(orpc.preset.find.queryOptions({ input: { id } }))
}

export default usePreset
