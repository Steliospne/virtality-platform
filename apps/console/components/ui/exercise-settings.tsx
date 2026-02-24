import { Slider } from '@/components/ui/slider'
import ExerciseInput from '@/components/ui/exercise-input'
import { Label } from '@/components/ui/label'
import ExerciseInputPill from '@/components/ui/exercise-input-pill'
import { CompleteExercise } from '@/types/models'
import { useRef } from 'react'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'
import { cn } from '@/lib/utils'

const applyBulkUpdate = (
  exercises: CompleteExercise[],
  selectedItems: string[],
  fieldName: string,
  value: string | number,
) => {
  return exercises.map((ex) =>
    selectedItems.includes(ex.id)
      ? {
          ...ex,
          [fieldName]: value,
        }
      : ex,
  )
}

const applyUpdate = (
  exercises: CompleteExercise[],
  currentExercise: number,
  name: string,
  value: string | number,
) => {
  return exercises.map((ex, index) =>
    currentExercise === index
      ? {
          ...ex,
          [name]: value,
        }
      : ex,
  )
}

interface ExerciseSettingsProps {
  ex: CompleteExercise
  exercises: PatientDashboardValue['state']['exercises']
  setExercises: PatientDashboardValue['handler']['setExercises']
  index: number
  selectedItems?: string[]
  orientation?: 'horizontal' | 'vertical'
}

const ExerciseSettings = ({
  ex,
  exercises,
  setExercises,
  index,
  selectedItems,
  orientation = 'horizontal',
}: ExerciseSettingsProps) => {
  const sliderRef = useRef<HTMLSpanElement | null>(null)

  const settingsChange = (target: {
    name: string
    value: string
    id: string
  }) => {
    if (!exercises) return
    const { id, value } = target
    const numericalInput = ['sets', 'reps', 'restTime', 'holdTime', 'speed']
    const [name, index] = id.split(',')
    const parsedValue = numericalInput.includes(name) ? Number(value) : value
    const currentExercise = exercises[+index]
    const hasBulkUpdates = selectedItems
      ? selectedItems.length !== 0 && selectedItems.includes(currentExercise.id)
      : false

    if (hasBulkUpdates) {
      return setExercises(
        applyBulkUpdate(exercises, selectedItems!, name, parsedValue),
      )
    }

    setExercises(applyUpdate(exercises, +index, name, parsedValue))
  }

  const sliderChangeHandler = (value: number[]) => {
    const target = sliderRef.current
    if (!target || !exercises) return

    const { id } = target
    const [name, index] = id.split(',')

    const currentExercise = exercises[+index]
    const hasBulkUpdates = selectedItems
      ? selectedItems.length !== 0 && selectedItems.includes(currentExercise.id)
      : false

    if (hasBulkUpdates) {
      return setExercises(
        applyBulkUpdate(exercises, selectedItems!, name, value[0]),
      )
    }

    setExercises(applyUpdate(exercises, +index, name, value[0]))
  }

  return (
    <div
      className={cn(
        'space-y-2',
        orientation === 'horizontal' && 'flex justify-between max-lg:flex-wrap',
      )}
    >
      <div className='flex items-center gap-2'>
        <Label htmlFor={'reps,' + index}>Reps</Label>
        <ExerciseInputPill
          id={'reps,' + index}
          name='reps'
          min={1}
          value={String(ex.reps)}
          onSetValue={settingsChange}
        />
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor={'sets,' + index}>Sets</Label>
        <ExerciseInputPill
          id={'sets,' + index}
          name='sets'
          min={1}
          value={String(ex.sets)}
          onSetValue={settingsChange}
        />
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor={'restTime,' + index}>Rest (sec)</Label>
        <ExerciseInput
          id={'restTime,' + index}
          name='restTime'
          type='text'
          inputMode='numeric'
          value={ex.restTime}
          step={1}
          min={0}
          max={60 * 60}
          onSetValue={settingsChange}
          className='w-16 border dark:border-zinc-600'
        />
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor={'holdTime,' + index}>Hold time (sec)</Label>
        <ExerciseInput
          id={'holdTime,' + index}
          name='holdTime'
          type='text'
          inputMode='numeric'
          step={1}
          min={0}
          value={ex.holdTime}
          onSetValue={settingsChange}
          className='w-16 border dark:border-zinc-600'
        />
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor={'speed,' + index}>Speed</Label>
        <Slider
          ref={sliderRef}
          id={'speed,' + index}
          min={0.1}
          max={2}
          step={0.1}
          onValueChange={sliderChangeHandler}
          value={[ex.speed]}
          className='min-w-32'
        />
        <div>{ex.speed}</div>
      </div>
    </div>
  )
}

export default ExerciseSettings
