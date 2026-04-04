import { cn, getDisplayName, getUUID } from '@/lib/utils'
import { Star, X } from 'lucide-react'
import FlipCard from '@/components//ui/flip-card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from './button'
import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import {
  useExercise,
  useExerciseCategories,
  useFavoriteExercise,
} from '@virtality/react-query'
import { withRom } from '@/lib/with-rom'
import { useFeatureFlagResult } from 'posthog-js/react'
import { Exercise } from '@virtality/db'
import { Skeleton } from './skeleton'

const ExerciseGrid = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const [toggledFavorites, setToggledFavorites] = useState(false)
  const [direction, setDirection] = useState<Exercise['direction'] | undefined>(
    undefined,
  )
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

  const { data: exercises, isLoading } = useExercise({
    input: { where: { direction: direction ?? undefined } },
  })

  const { data: categories } = useExerciseCategories()

  const { data: favorites } = useFavoriteExercise()

  const { state, handler } = useExerciseLibrary()
  const { isSelected } = state
  const { selectExercise, removeExercise } = handler

  const filtersFlag = useFeatureFlagResult('exercise_filters')

  const displayedExercises = toggledFavorites
    ? exercises?.filter((e) => favorites?.some((f) => f.exerciseId === e.id))
    : exercises

  useEffect(() => {
    if (categories?.[0] && !activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(categories[0])
    }
  }, [categories, activeTab])

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
      selectExercise(withRom(preppedExercise))
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

  const toggleFavorites = () => {
    setToggledFavorites((prev) => !prev)
  }

  const selectDirection = (direction: Exercise['direction'] | undefined) => {
    setDirection(direction)
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className='overflow-hidden rounded-lg border p-2'
    >
      <TabsList className='flex h-fit flex-wrap gap-2'>
        {categories?.map((category, index) => (
          <TabsTrigger key={index} value={category} className='size-fit'>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories?.map((category, index) => (
        <TabsContent key={index} value={category} className='overflow-auto p-2'>
          {/* Search bar */}
          <div className='sticky top-0 z-10 m-2 w-[calc(100%-16px)] space-y-2'>
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
            {filtersFlag?.enabled && filtersFlag.payload === false ? null : (
              <div className='flex w-full items-center gap-2 rounded-md'>
                <Button
                  size='sm'
                  variant='default'
                  onClick={toggleFavorites}
                  className={cn(toggledFavorites && 'ring-cyan-highlight')}
                >
                  <Star fill='yellow' />
                  Favorites
                </Button>
                <div>
                  <Button
                    size='sm'
                    variant='default'
                    className={cn(
                      'rounded-r-none',
                      direction === 'Left' && 'ring-cyan-highlight',
                    )}
                    onClick={() => selectDirection('Left')}
                  >
                    Left
                  </Button>
                  <Button
                    size='sm'
                    variant='default'
                    className={cn(
                      'rounded-none',
                      direction === undefined && 'ring-cyan-highlight',
                    )}
                    onClick={() => selectDirection(undefined)}
                  >
                    All
                  </Button>
                  <Button
                    size='sm'
                    variant='default'
                    className={cn(
                      'rounded-l-none',
                      direction === 'Right' && 'ring-cyan-highlight',
                    )}
                    onClick={() => selectDirection('Right')}
                  >
                    Right
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className='grid justify-items-center gap-4 sm:grid-cols-3 2xl:grid-cols-5'>
            {isLoading ? (
              <>
                {Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className='aspect-4/5 w-full sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px]'
                  />
                ))}
              </>
            ) : (
              displayedExercises
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
                    toggledFavorites={toggledFavorites}
                    favoriteExerciseId={
                      favorites?.find((f) => f.exerciseId === exercise.id)
                        ?.id ?? null
                    }
                    onSelect={
                      isSelected?.[exercise.id]
                        ? _removeExercise
                        : _selectExercise
                    }
                  />
                ))
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default ExerciseGrid
