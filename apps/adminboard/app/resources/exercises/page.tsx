import { getExercises } from '@/lib/actions/exerciseActions'
import { getQueryClient } from '@/react-query'
import ExerciseTableDAL from '@/components/resources/exercises/exercise-table'
import Boundary from '@/components/shared/hydration-boundary'

const ExercisePage = async () => {
  const queryClient = getQueryClient()
  queryClient.prefetchQuery({ queryKey: ['exercises'], queryFn: getExercises })

  return (
    <Boundary client={queryClient}>
      <ExerciseTableDAL />;
    </Boundary>
  )
}

export default ExercisePage
