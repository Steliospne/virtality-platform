import { getDisplayName, getUUID } from '@/lib/utils'
import { X } from 'lucide-react'
import FlipCard from '@/components//ui/flip-card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from './button'
import { ChangeEvent, MouseEvent, useMemo, useState } from 'react'
import sortedUniq from 'lodash.sorteduniq'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import useExercise from '@/hooks/queries/use-exercise'

const ExerciseGrid = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: exercises } = useExercise()

  const { state, handler } = useExerciseLibrary()
  const { isSelected } = state
  const { selectExercise, removeExercise } = handler

  const categories = useMemo(() => {
    return (
      sortedUniq(
        exercises
          ?.sort((prev, curr) => prev.category!.localeCompare(curr.category!))
          .map((e) => e.category),
      ) ?? []
    )
  }, [exercises])

  const _selectExercise = (e: MouseEvent) => {
    const { id } = e.currentTarget
    if (!id) return
    const exerciseToAdd = exercises?.find((e) => e.id === id)
    if (exerciseToAdd && !isSelected?.[exerciseToAdd.id]) {
      const preppedExercise = {
        exerciseId: exerciseToAdd.id,
        id: getUUID(),
        reps: 10,
        sets: 3,
        restTime: 5,
        holdTime: 1,
        speed: 1.0,
        exercise: exerciseToAdd,
      }
      selectExercise(preppedExercise)
    }
  }

  const _removeExercise = (e: MouseEvent) => {
    const { id } = e.currentTarget as HTMLElement
    if (!id) return
    const exerciseToRemove = exercises?.find((e) => e.id === id)

    if (!exerciseToRemove) return
    removeExercise(exerciseToRemove.id)
  }

  const changeSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setSearchTerm(value)
  }

  const clearSearchTerm = () => {
    setSearchTerm('')
  }

  return (
    <Tabs
      defaultValue={categories[0]}
      className='overflow-hidden rounded-lg border p-2'
    >
      <TabsList className='flex h-fit flex-wrap'>
        {categories.map((category, index) => (
          <TabsTrigger key={index} value={category} className='size-fit'>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category, index) => (
        <TabsContent key={index} value={category} className='overflow-auto p-2'>
          {/* Search bar */}
          <div className='sticky top-0 z-10 m-2 w-[calc(100%-16px)]'>
            <Input
              id='searchTerm'
              name='searchTerm'
              type='text'
              placeholder='Search...'
              value={searchTerm}
              onChange={changeSearchInput}
              className='bg-zinc-100 dark:bg-zinc-950!'
            />
            {searchTerm !== '' && (
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='absolute top-1.5 right-2 size-6'
                onClick={clearSearchTerm}
              >
                <X />
              </Button>
            )}
          </div>

          <div className='grid justify-items-center gap-4 md:grid-cols-3 2xl:grid-cols-5'>
            {exercises
              ?.filter((ex) => ex.category === category)
              .filter((ex) =>
                getDisplayName(ex)
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()),
              )
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((exercise) => (
                <FlipCard
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={isSelected?.[exercise.id] ?? false}
                  onSelect={
                    isSelected?.[exercise.id]
                      ? _removeExercise
                      : _selectExercise
                  }
                />
              ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default ExerciseGrid
