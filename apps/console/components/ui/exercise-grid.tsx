import { cn, getDisplayName, getUUID } from '@/lib/utils'
import { bodyGroupIconSrcForCategory } from '@/lib/body-group-icon'
import { filterExercisesByBodyParts } from '@/lib/filter-exercises-by-body-parts'
import {
  filterExercisesByEquipment,
  formatExerciseEquipmentChipLabel,
} from '@/lib/filter-exercises-by-equipment'
import { Star, X } from 'lucide-react'
import FlipCard from '@/components/ui/flip-card'
import { Input } from '@/components/ui/input'
import { Button } from './button'
import { ChangeEvent, MouseEvent, useMemo, useState } from 'react'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import {
  useExercise,
  useExerciseCategories,
  useExerciseItems,
  useFavoriteExercise,
} from '@virtality/react-query'
import { withRom } from '@/lib/with-rom'
import { Skeleton } from './skeleton'

function toggleStringInList(prev: string[], value: string): string[] {
  return prev.includes(value)
    ? prev.filter((entry) => entry !== value)
    : [...prev, value]
}

const ExerciseGrid = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [toggledFavorites, setToggledFavorites] = useState(false)
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  const [selectedEquipmentKeys, setSelectedEquipmentKeys] = useState<
    string[]
  >([])

  const { data: exercises, isLoading } = useExercise()

  const { data: categories } = useExerciseCategories()
  const { data: equipmentKeys } = useExerciseItems()

  const { data: favorites } = useFavoriteExercise()

  const { state, handler } = useExerciseLibrary()
  const { isSelected } = state
  const { selectExercise, removeExercise } = handler

  const toggleBodyPart = (category: string) => {
    setSelectedBodyParts((prev) => toggleStringInList(prev, category))
  }

  const toggleEquipmentKey = (key: string) => {
    setSelectedEquipmentKeys((prev) => toggleStringInList(prev, key))
  }

  const displayedExercises = useMemo(() => {
    if (!exercises) return undefined
    const byBody = filterExercisesByBodyParts(exercises, selectedBodyParts)
    const byEquipment = filterExercisesByEquipment(
      byBody,
      selectedEquipmentKeys,
    )
    const byFav = toggledFavorites
      ? byEquipment.filter((e) =>
          favorites?.some((f) => f.exerciseId === e.id),
        )
      : byEquipment
    return byFav
      .filter((ex) =>
        getDisplayName(ex)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [
    exercises,
    selectedBodyParts,
    selectedEquipmentKeys,
    toggledFavorites,
    favorites,
    searchTerm,
  ])

  const handleSelectExercise = (e: MouseEvent) => {
    const { id } = e.currentTarget
    if (!id) return
    const exerciseToAdd = exercises?.find((ex) => ex.id === id)
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

  const handleRemoveExercise = (e: MouseEvent) => {
    const { id } = e.currentTarget
    if (!id) return
    const exerciseToRemove = exercises?.find((ex) => ex.id === id)

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

  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-lg border p-2'>
      <div className='mb-3 flex flex-wrap gap-2'>
        {categories?.map((category) => {
          const selected = selectedBodyParts.includes(category)
          const iconSrc = bodyGroupIconSrcForCategory(category)
          return (
            <Button
              key={category}
              type='button'
              size='sm'
              variant='outline'
              aria-pressed={selected}
              onClick={() => toggleBodyPart(category)}
              className={cn(
                'h-auto gap-2 py-1.5',
                selected && 'ring-2 ring-cyan-highlight',
              )}
            >
              {iconSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- static body-group SVGs from /public
                <img
                  src={iconSrc}
                  alt=''
                  width={24}
                  height={24}
                  className='size-6 shrink-0'
                />
              ) : null}
              <span>{category}</span>
            </Button>
          )
        })}
      </div>

      <div className='mb-3 flex flex-wrap gap-2'>
        {equipmentKeys?.map((key) => {
          const selected = selectedEquipmentKeys.includes(key)
          return (
            <Button
              key={key}
              type='button'
              size='sm'
              variant='outline'
              aria-pressed={selected}
              onClick={() => toggleEquipmentKey(key)}
              className={cn(
                'h-auto py-1.5',
                selected && 'ring-2 ring-cyan-highlight',
              )}
            >
              {formatExerciseEquipmentChipLabel(key)}
            </Button>
          )
        })}
      </div>

      <div className='relative mb-3 w-full max-w-md space-y-2'>
        <Input
          id='searchTerm'
          name='searchTerm'
          type='text'
          placeholder='Search...'
          value={searchTerm}
          onChange={changeSearchInput}
          className='bg-zinc-100 pr-8 dark:bg-zinc-950!'
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
        <Button
          type='button'
          size='sm'
          variant='default'
          onClick={toggleFavorites}
          className={cn(toggledFavorites && 'ring-cyan-highlight')}
        >
          <Star fill='yellow' />
          Favorites
        </Button>
      </div>

      <div className='grid justify-items-center gap-4 sm:grid-cols-3 2xl:grid-cols-5'>
        {isLoading ? (
          Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
              key={i}
              className='aspect-4/5 w-full sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px]'
            />
          ))
        ) : (
          displayedExercises?.map((exercise) => (
            <FlipCard
              key={exercise.id}
              exercise={exercise}
              isSelected={isSelected?.[exercise.id] ?? false}
              toggledFavorites={toggledFavorites}
              favoriteExerciseId={
                favorites?.find((f) => f.exerciseId === exercise.id)?.id ??
                null
              }
              onSelect={
                isSelected?.[exercise.id]
                  ? handleRemoveExercise
                  : handleSelectExercise
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ExerciseGrid
