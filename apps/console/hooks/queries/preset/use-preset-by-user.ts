import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'
import { PresetFindManyArgs } from '@virtality/db'

const usePresetsByUser = ({
  where,
  orderBy,
  skip,
  take,
}: PresetFindManyArgs) => {
  return useQuery(
    orpc.preset.listUser.queryOptions({
      input: { where, orderBy, skip, take },
    }),
  )
}

export default usePresetsByUser
