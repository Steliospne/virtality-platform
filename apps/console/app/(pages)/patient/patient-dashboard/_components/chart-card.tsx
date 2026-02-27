import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Chart from '@/components/ui/progress-chart'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import useExercise from '@/hooks/queries/use-exercise'
import { getDisplayName } from '@/lib/utils'

const ChartCard = ({ className }: { className?: string }) => {
  const { state, plotData } = usePatientDashboard()
  const { exercises, activeExerciseData } = state
  const { data: defaultExercise } = useExercise()

  const chartTitle = getDisplayName(
    defaultExercise?.find((e) => e.id === activeExerciseData.id),
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {exercises && exercises?.length !== 0
            ? `${chartTitle}`
            : 'Exercise not found'}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <Chart data={plotData} />
      </CardContent>
    </Card>
  )
}

export default ChartCard
