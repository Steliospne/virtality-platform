'use client'
import { Fragment } from 'react'
import { cn, getDisplayName } from '@/lib/utils'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import ExerciseDescriptionCard from '@/components/ui/exercise-description-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
} from '@/components/ui/item'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
} from '@/components/ui/popover'
import ExerciseSettings from '@/components/ui/exercise-settings'
import { motion } from 'motion/react'
import useExercise from '@/hooks/queries/use-exercise'

const ExerciseList = ({ className }: { className?: string }) => {
  const { state, handler, currExercise } = usePatientDashboard()
  const {
    programState,
    selectedMode,
    exercises,
    selectedDevice,
    activeExerciseData,
  } = state
  const { setExercises, updatePatientDashboardState } = handler
  const { data: defaultExercises } = useExercise()

  const isProgramActive = programState === 'started'
  const isProgramInactive = programState === 'ready'
  const isProgramPaused = programState === 'paused'

  const isMain = selectedMode === 'main'

  const applySettings = (index: number) => {
    if (!exercises) return

    const { exerciseId, sets, reps, restTime, holdTime, speed } =
      exercises[index]

    const payload = {
      id: exerciseId,
      sets,
      reps,
      restTime,
      holdTime,
      speed,
    }

    if (currExercise.current === index) {
      updatePatientDashboardState({
        activeExerciseData: {
          ...activeExerciseData,
          totalReps: reps,
          totalSets: sets,
        },
      })
    }

    selectedDevice?.settingsChange(payload)
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0 || !exercises) return

    const newExercises = [...exercises]
    ;[newExercises[index - 1], newExercises[index]] = [
      newExercises[index],
      newExercises[index - 1],
    ]

    setExercises(newExercises)
  }

  const moveExerciseDown = (index: number) => {
    if (index === exercises.length - 1 || !exercises) return

    const newExercises = [...exercises]
    ;[newExercises[index], newExercises[index + 1]] = [
      newExercises[index + 1],
      newExercises[index],
    ]

    setExercises(newExercises)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Exercises</CardTitle>
      </CardHeader>
      <CardContent className='overflow-auto p-2'>
        {exercises.length !== 0 ? (
          <ItemGroup>
            {exercises.map((ex, index) => {
              const isHighlighted =
                (isProgramActive || isProgramPaused) &&
                isMain &&
                index === currExercise.current

              const defaultExercise = defaultExercises?.find(
                (de) => de.id === ex.exerciseId,
              )

              return (
                <Fragment key={ex.id}>
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
                  >
                    <Item
                      id={ex.id}
                      size='sm'
                      className={cn(
                        'hover:bg-vital-blue-700/20 px-2',
                        isHighlighted && 'text-green-400',
                      )}
                    >
                      <ItemMedia className='flex-col'>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          onClick={() => moveExerciseUp(index)}
                          disabled={
                            index === 0 || isProgramActive || isProgramPaused
                          }
                        >
                          <ChevronUp />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          onClick={() => moveExerciseDown(index)}
                          disabled={
                            index === exercises.length - 1 ||
                            isProgramActive ||
                            isProgramPaused
                          }
                        >
                          <ChevronDown />
                        </Button>
                      </ItemMedia>
                      {defaultExercise && (
                        <ExerciseDescriptionCard exercise={defaultExercise} />
                      )}

                      <p
                        className='flex-1 truncate overflow-x-hidden hover:cursor-pointer'
                        onClick={() => {
                          selectedDevice?.changeExercise(ex.exerciseId)
                          currExercise.current = index
                        }}
                      >
                        {getDisplayName(defaultExercise)}
                      </p>

                      <ItemActions>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant='outline' size='icon'>
                              <Settings />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side='right'
                            className='flex flex-col gap-4'
                          >
                            <ExerciseSettings
                              ex={ex}
                              exercises={exercises}
                              setExercises={setExercises}
                              index={index}
                              orientation='vertical'
                            />

                            <div className='col-start-3 place-self-end'>
                              <Button
                                disabled={isProgramInactive}
                                onClick={() => applySettings(index)}
                              >
                                Apply Changes
                              </Button>
                            </div>
                            <PopoverArrow className='fill-zinc-200 dark:fill-zinc-800' />
                          </PopoverContent>
                        </Popover>
                      </ItemActions>
                    </Item>
                  </motion.div>
                  {index !== exercises.length - 1 && <ItemSeparator />}
                </Fragment>
              )
            })}
          </ItemGroup>
        ) : (
          <p className='text-muted-foreground'>No exercises...</p>
        )}
      </CardContent>
    </Card>
  )
}

export default ExerciseList
