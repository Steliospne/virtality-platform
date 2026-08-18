'use client'

import { Button } from '@virtality/ui/components/button'
import Chart from '@/components/ui/progress-chart'
import { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Exercise } from '@virtality/db'

const getSessionChartExerciseTitle = (exercise?: Exercise) => {
  if (!exercise) return undefined

  const direction = exercise.direction.trim()
  if (!direction || direction.toLowerCase() === 'both') {
    return exercise.displayName
  }

  return `${exercise.displayName} ${direction}`
}

const SessionCardChart = ({
  session,
  exercises,
}: {
  session: ExtendedPatientSession
  exercises?: Exercise[]
}) => {
  const [chartIndex, setChartIndex] = useState(0)

  const chartData =
    session?.sessionData.map((data) => {
      const value = JSON.parse(data.value) as ProgressDataPoint[]
      const id = session.sessionExercise.find(
        (ex) => ex.id === data.sessionExerciseId,
      )?.exerciseId
      const name = getSessionChartExerciseTitle(
        exercises?.find((ex) => ex.id === id),
      )
      return { value, name }
    }) ?? []

  const increment = () => {
    setChartIndex((prev) => prev + 1)
  }

  const decrement = () => {
    setChartIndex((prev) => prev - 1)
  }

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex items-center justify-between gap-6 p-4'>
        <div>{chartData[chartIndex].name}</div>
        <div className='flex'>
          <Button
            size='icon'
            variant='outline'
            disabled={chartIndex === 0}
            onClick={decrement}
            className='rounded-r-none'
          >
            <ChevronLeft />
          </Button>
          <Button
            size='icon'
            variant='outline'
            disabled={chartIndex === chartData.length - 1}
            onClick={increment}
            className='rounded-l-none'
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <Chart
        data={chartData[chartIndex].value}
        className='aspect-none flex-1 xl:max-h-[46svh]'
      />
    </div>
  )
}

export default SessionCardChart
