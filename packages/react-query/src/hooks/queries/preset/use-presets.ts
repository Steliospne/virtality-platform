import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function usePresets() {
  const orpc = useORPC()
  return useQuery(orpc.legacy.preset.list.queryOptions({ staleTime: 'static' }))
}
