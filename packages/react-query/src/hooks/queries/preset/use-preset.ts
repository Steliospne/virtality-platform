import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

interface UsePresetProps {
  id: string
}

export function usePreset({ id }: UsePresetProps) {
  const orpc = useORPC()
  return useQuery(orpc.legacy.preset.find.queryOptions({ input: { id } }))
}
