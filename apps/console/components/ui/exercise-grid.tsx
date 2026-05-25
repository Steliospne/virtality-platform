import { cn, getUUID } from '@/lib/utils'
import { bodyGroupIconSrcForCategory } from '@/lib/body-group-icon'
import { filterExercisesForLibrary } from '@virtality/shared/utils'
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
import Image from 'next/image'

function equipmentChipLabel(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const ExerciseGrid = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  const [selectedEquipmentKeys, setSelectedEquipmentKeys] = useState<string[]>(
    [],
  )

  const { data: exercises, isLoading } = useExercise()

  const { data: categories } = useExerciseCategories()

  const { data: equipmentKeys } = useExerciseItems()

  const { data: favorites } = useFavoriteExercise()

  const { state, handler } = useExerciseLibrary()
  const { isSelected } = state
  const { selectExercise, removeExercise } = handler

  /** Favorite row id by exercise id (first list entry wins, same as `Array#find`). */
  const favoriteIdByExerciseId = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of favorites ?? []) {
      if (!map.has(row.exerciseId)) {
        map.set(row.exerciseId, row.id)
      }
    }
    return map
  }, [favorites])

  const toggleBodyPart = (category: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  const toggleEquipment = (key: string) => {
    setSelectedEquipmentKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const favoriteExerciseIds = useMemo(
    () => favorites?.map((f) => f.exerciseId) ?? [],
    [favorites],
  )

  const favoriteRowIdByExerciseId = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of favorites ?? []) {
      if (!map.has(f.exerciseId)) map.set(f.exerciseId, f.id)
    }
    return map
  }, [favorites])

  const displayedExercises = useMemo(() => {
    if (!exercises) return undefined
    return filterExercisesForLibrary(exercises, {
      selectedBodyParts,
      selectedEquipmentKeys,
      searchTerm,
      favoritesOnly,
      favoriteExerciseIds,
    })
  }, [
    exercises,
    selectedBodyParts,
    selectedEquipmentKeys,
    searchTerm,
    favoritesOnly,
    favoriteExerciseIds,
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

  const toggleFavoritesOnly = () => {
    setFavoritesOnly((prev) => !prev)
  }

  const showEmptyState =
    !isLoading && exercises && displayedExercises?.length === 0

  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-lg border p-2'>
      <div className='flex flex-col gap-2'>
        <h2>Select By Body Part</h2>
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
                  'flex h-auto flex-col items-center gap-2 py-1.5',
                  selected && 'ring-cyan-highlight ring-2',
                )}
              >
                {iconSrc ? (
                  <Image
                    src={iconSrc}
                    alt={category}
                    width={24}
                    height={24}
                    className='size-18 shrink-0'
                  />
                ) : null}
                <span>{category}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h2>Select By Equipment</h2>
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
                onClick={() => toggleEquipment(key)}
                className={cn(
                  'h-auto py-1.5',
                  selected && 'ring-cyan-highlight ring-2',
                )}
              >
                {equipmentChipLabel(key)}
              </Button>
            )
          })}
        </div>
      </div>

      <div className='mb-3 flex max-w-md flex-wrap items-start gap-2'>
        <div className='relative min-w-[12rem] flex-1'>
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
        </div>
        <Button
          type='button'
          size='icon'
          variant='outline'
          aria-pressed={favoritesOnly}
          aria-label='Show favorites only'
          onClick={toggleFavoritesOnly}
          className={cn(
            'mt-0 shrink-0',
            favoritesOnly && 'ring-cyan-highlight ring-2',
          )}
        >
          <Star className={cn(favoritesOnly && 'fill-yellow-400')} />
        </Button>
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
        ) : showEmptyState ? (
          <p className='text-muted-foreground col-span-full py-8 text-center text-sm'>
            No exercises match your filters.
          </p>
        ) : (
          displayedExercises?.map((exercise) => (
            <FlipCard
              key={exercise.id}
              exercise={exercise}
              isSelected={isSelected?.[exercise.id] ?? false}
              favoriteExerciseId={
                favoriteRowIdByExerciseId.get(exercise.id) ?? null
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
