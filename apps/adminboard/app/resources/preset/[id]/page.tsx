import PresetView from '@/components/resources/preset/edit/preset-view'
import Boundary from '@/components/shared/hydration-boundary'
import { getPresetWithExercises } from '@/data/server/preset'
import { getQueryClient } from '@/react-query'

const PresetViewPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const queryClient = getQueryClient()
  const { id } = await params

  queryClient.prefetchQuery({
    queryKey: ['preset', id],
    queryFn: () => getPresetWithExercises(id),
  })

  return (
    <Boundary client={queryClient}>
      <PresetView id={id} />
    </Boundary>
  )
}

export default PresetViewPage
