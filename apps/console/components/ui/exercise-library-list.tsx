import { MouseEvent } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FolderClosed,
  Settings,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn, getDisplayName } from '@/lib/utils'
import ExerciseSettings from '@/components/ui/exercise-settings'
import { ExerciseWithSettings } from '@/types/models'
import ExerciseLibraryDialog from '@/components/ui/exercise-library-dialog'
import { P } from './typography'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { motion } from 'motion/react'
import useExercise from '@/hooks/queries/use-exercise'

interface ExerciseLibraryListProps {
  className?: string
}

const ExerciseLibraryList = ({ className }: ExerciseLibraryListProps) => {
  const { state, handler } = useExerciseLibrary()
  const { data: defaultExercises } = useExercise()
  const { selectedExercises, globalCheck, toggledSettings, selectedItems } =
    state

  const {
    setLibraryOpen,
    setToggledSettings,
    updateExercises,
    updateFormState,
  } = handler

  const toggleSettings = (e: MouseEvent) => {
    const { id } = e.currentTarget
    if (!id) return

    if (!toggledSettings) setToggledSettings({ [id]: true })
    else setToggledSettings({ [id]: !toggledSettings[id] })
  }

  const checkboxChange = (exercise: ExerciseWithSettings) => {
    const itemExists = selectedItems.find((item) => item === exercise.id)

    if (itemExists) {
      const newSelectedItems = selectedItems.filter(
        (item) => item !== exercise.id,
      )
      updateFormState({
        selectedItems: newSelectedItems,
        globalCheck: newSelectedItems.length === selectedExercises.length,
      })
    } else {
      const newSelectedItems = [...selectedItems, exercise.id]
      updateFormState({
        selectedItems: newSelectedItems,
        globalCheck: newSelectedItems.length === selectedExercises.length,
      })
    }
  }

  const checkAll = (checked: boolean) => {
    const newSelectedItems = checked ? selectedExercises.map((e) => e.id) : []
    updateFormState({
      selectedItems: newSelectedItems,
      globalCheck: checked,
    })
  }

  const deleteSelected = () => {
    const exercisesToUpdate = selectedExercises.filter((ex) =>
      selectedItems.every((exToRemove) => exToRemove !== ex.id),
    )
    updateExercises(exercisesToUpdate)
    updateFormState({ globalCheck: false, selectedItems: [] })
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0 || !selectedExercises) return

    const newExercises = [...selectedExercises]
    ;[newExercises[index - 1], newExercises[index]] = [
      newExercises[index],
      newExercises[index - 1],
    ]

    updateExercises(newExercises)
  }

  const moveExerciseDown = (index: number) => {
    if (index === selectedExercises.length - 1 || !selectedExercises) return

    const newExercises = [...selectedExercises]
    ;[newExercises[index], newExercises[index + 1]] = [
      newExercises[index + 1],
      newExercises[index],
    ]

    updateExercises(newExercises)
  }

  const isListEmpty = selectedExercises.length === 0

  return (
    <div className={cn('flex max-h-full w-full flex-col border', className)}>
      <div className='flex justify-between dark:bg-zinc-950'>
        <div className='flex items-center'>
          <Checkbox
            className='m-4'
            checked={globalCheck}
            onCheckedChange={checkAll}
          />
          <p className='text-muted-foreground text-sm'>Select all</p>
        </div>

        <div className='flex items-center gap-2'>
          <span>Exercise library</span>

          <Button
            variant='ghost'
            size='icon'
            onClick={() => setLibraryOpen(true)}
          >
            <FolderClosed />
          </Button>
        </div>

        <div className='flex items-center'>
          <span>Remove Selected</span>
          <Button
            size='icon'
            variant='destructive'
            onClick={deleteSelected}
            disabled={selectedItems.length === 0}
            className='m-4'
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <Separator />

      <ul className='flex max-h-full w-full flex-col gap-2 overflow-auto rounded-lg p-4 dark:text-zinc-200'>
        {!isListEmpty ? (
          selectedExercises.map((e, i) => {
            const exerciseInfo = defaultExercises?.find(
              (de) => de.id === e.exerciseId,
            )

            return (
              <li key={e.id} className='space-y-2'>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    layout: { duration: 0.3, ease: 'easeInOut' },
                    opacity: { duration: 0.2 },
                    y: { duration: 0.2 },
                  }}
                  className='flex flex-col'
                >
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      checked={selectedItems.includes(e.id)}
                      onCheckedChange={() => checkboxChange(e)}
                    />
                    <p className='flex-1'>{getDisplayName(exerciseInfo)}</p>
                    <Button
                      id={e.id}
                      type='button'
                      size='icon'
                      variant='outline'
                      onClick={toggleSettings}
                    >
                      <Settings className='size-4' />
                    </Button>
                  </div>

                  <div className='flex items-center gap-3'>
                    {/* Re-Order */}
                    <div className='flex flex-col'>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => moveExerciseUp(i)}
                        disabled={i === 0}
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => moveExerciseDown(i)}
                        disabled={i === selectedExercises.length - 1}
                      >
                        <ChevronDown />
                      </Button>
                    </div>
                    {/* Exercise Settings */}
                    <div className='flex-1'>
                      {toggledSettings?.[e.id] && (
                        <ExerciseSettings
                          key={e.id}
                          ex={e}
                          exercises={selectedExercises}
                          selectedItems={selectedItems}
                          index={i}
                          setExercises={updateExercises}
                        />
                      )}
                    </div>
                  </div>

                  {i === selectedExercises.length - 1 ? null : (
                    <Separator className='my-2' />
                  )}
                </motion.div>
              </li>
            )
          })
        ) : (
          <P>Exercise list is empty.</P>
        )}
      </ul>

      <ExerciseLibraryDialog />
    </div>
  )
}

export default ExerciseLibraryList
