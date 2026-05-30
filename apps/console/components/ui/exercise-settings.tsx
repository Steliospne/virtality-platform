import { Slider } from '@/components/ui/slider'
import ExerciseInput from '@/components/ui/exercise-input'
import { Label } from '@virtality/ui/components/label'
import ExerciseInputPill from '@/components/ui/exercise-input-pill'
import { CompleteExercise } from '@/types/models'
import { useRef } from 'react'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'
import { cn } from '@/lib/utils'
import { Switch } from './switch'
import { useFeatureFlagResult } from 'posthog-js/react'

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

const applyUnifiedPairUpdate = (
  exercises: CompleteExercise[],
  primaryIndex: number,
  siblingIndex: number,
  name: string,
  value: string | number,
) => {
  return exercises.map((ex, index) =>
    index === primaryIndex || index === siblingIndex
      ? { ...ex, [name]: value }
      : ex,
  )
}

function applyFieldFromControlId(
  exercises: CompleteExercise[],
  controlId: string,
  value: string | number,
  options: {
    unifiedSiblingIndex?: number
    selectedItems?: string[]
  },
): CompleteExercise[] {
  const [fieldName, rowIndexStr] = controlId.split(',')
  return patchExerciseSettingsField(exercises, {
    fieldName,
    rowIndex: +rowIndexStr,
    value,
    ...options,
  })
}

/** Shared path for unified bilateral rows, bulk selection, or a single row. */
function patchExerciseSettingsField(
  exercises: CompleteExercise[],
  {
    fieldName,
    rowIndex,
    value,
    unifiedSiblingIndex,
    selectedItems,
  }: {
    fieldName: string
    rowIndex: number
    value: string | number
    unifiedSiblingIndex?: number
    selectedItems?: string[]
  },
): CompleteExercise[] {
  if (unifiedSiblingIndex != null) {
    return applyUnifiedPairUpdate(
      exercises,
      rowIndex,
      unifiedSiblingIndex,
      fieldName,
      value,
    )
  }
  const currentExercise = exercises[rowIndex]
  const hasBulkUpdates = selectedItems
    ? selectedItems.length !== 0 && selectedItems.includes(currentExercise.id)
    : false
  if (hasBulkUpdates) {
    return applyBulkUpdate(exercises, selectedItems!, fieldName, value)
  }
  return applyUpdate(exercises, rowIndex, fieldName, value)
}

interface ExerciseSettingsProps {
  ex: CompleteExercise
  exercises: PatientDashboardValue['state']['exercises']
  setExercises: PatientDashboardValue['handler']['setExercises']
  index: number
  /** When set, the same field update is applied to `index` and this sibling index (unified bilateral row). */
  unifiedSiblingIndex?: number
  selectedItems?: string[]
  orientation?: 'horizontal' | 'vertical'
}

const ExerciseSettings = ({
  ex,
  exercises,
  setExercises,
  index,
  unifiedSiblingIndex,
  selectedItems,
  orientation = 'horizontal',
}: ExerciseSettingsProps) => {
  const sliderRef = useRef<HTMLSpanElement | null>(null)
  const romRef = useRef<HTMLButtonElement | null>(null)

  const romEnabled = useFeatureFlagResult('rom_mode_feature')

  const settingsChange = (target: {
    name: string
    value: string
    id: string
  }) => {
    if (!exercises) return
    const { id, value } = target
    const numericalInput = ['sets', 'reps', 'restTime', 'holdTime', 'speed']
    const [fieldName] = id.split(',')
    const parsedValue = numericalInput.includes(fieldName)
      ? Number(value)
      : value

    setExercises(
      applyFieldFromControlId(exercises, id, parsedValue, {
        unifiedSiblingIndex,
        selectedItems,
      }),
    )
  }

  const sliderChangeHandler = (value: number[]) => {
    const target = sliderRef.current
    if (!target || !exercises) return

    const { id } = target

    setExercises(
      applyFieldFromControlId(exercises, id, value[0], {
        unifiedSiblingIndex,
        selectedItems,
      }),
    )
  }

  const romModeChangeHandler = (value: boolean) => {
    const target = romRef.current
    if (!target || !exercises) return

    const { id } = target

    setExercises(
      applyFieldFromControlId(exercises, id, value ? 1 : 0, {
        unifiedSiblingIndex,
        selectedItems,
      }),
    )
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
      {(romEnabled?.enabled && romEnabled.payload === true) ||
        (!romEnabled?.enabled && (
          <div className='flex items-center gap-2'>
            <Label htmlFor={'romMode,' + index}>ROM</Label>
            <Switch
              ref={romRef}
              name='romMode'
              id={'romMode,' + index}
              checked={ex.romMode === 1}
              onCheckedChange={romModeChangeHandler}
            />
          </div>
        ))}
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
