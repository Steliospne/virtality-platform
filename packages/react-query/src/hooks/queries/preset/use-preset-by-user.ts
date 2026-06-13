import { useQuery } from '@tanstack/react-query'
import type { PresetFindManyArgs } from '@virtality/db'
import { useORPC } from '../../../orpc-context.js'

export function usePresetsByUser({
  where,
  orderBy,
  skip,
  take,
}: PresetFindManyArgs) {
  const orpc = useORPC()
  return useQuery(
    orpc.legacy.preset.listUser.queryOptions({
      input: { where, orderBy, skip, take },
    }),
  )
}
