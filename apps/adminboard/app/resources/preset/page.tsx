import PresetTableDAL from '@/components/resources/preset/preset-table'
import Boundary from '@/components/shared/hydration-boundary'
import { getPresets } from '@/data/server/preset'
import { getQueryClient } from '@/react-query'

export const revalidate = false

const PresetPage = async () => {
  const queryClient = getQueryClient()
  queryClient.prefetchQuery({ queryKey: ['presets'], queryFn: getPresets })

  return (
    <Boundary client={queryClient}>
      <PresetTableDAL />
    </Boundary>
  )
}

export default PresetPage
