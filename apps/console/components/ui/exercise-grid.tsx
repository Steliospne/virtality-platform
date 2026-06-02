import { cn, getUUID } from '@/lib/utils'
import { bodyGroupIconSrcForCategory } from '@/lib/body-group-icon'
import {
  familyMemberForNearTermDirection,
  familyMembersForLibrarySelection,
  filterExerciseFamiliesForLibrary,
  libraryFamilySelectionState,
  type DirectionBadgeHighlight,
  type ExerciseFamilyForLibrary,
  type ExerciseLibraryFilterRow,
  type NearTermDirection,
} from '@virtality/shared/utils'
import { Star, X } from 'lucide-react'
import FlipCard from '@/components/ui/flip-card'
import { Input } from '@virtality/ui/components/input'
import { Button } from '@virtality/ui/components/button'
import { ChangeEvent, useMemo, useState } from 'react'
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
import { equipmentIconSrcForItem } from '@/lib/equipment-icon'

function equipmentChipLabel(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function directionBadgesWithSelection<T extends ExerciseLibraryFilterRow>(
  family: ExerciseFamilyForLibrary<T>,
  isSelected: Record<string, boolean> | null | undefined,
): DirectionBadgeHighlight[] | undefined {
  if (family.directionBadges.length === 0) return undefined
  return family.directionBadges.map((badge) => {
    const member = familyMemberForNearTermDirection(family, badge.side)
    return {
      ...badge,
      selected: member ? Boolean(isSelected?.[member.id]) : false,
    }
  })
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

  const displayedFamilies = useMemo(() => {
    if (!exercises) return undefined
    return filterExerciseFamiliesForLibrary(exercises, {
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

  const addLibraryVariant = (exerciseId: string) => {
    if (!exercises) return
    const exerciseToAdd = exercises.find((ex) => ex.id === exerciseId)
    if (!exerciseToAdd || isSelected?.[exerciseId]) return
    selectExercise(
      withRom({
        exerciseId: exerciseToAdd.id,
        id: getUUID(),
        reps: 10,
        sets: 3,
        restTime: 5,
        holdTime: 1,
        speed: 1.0,
        exercise: exerciseToAdd,
      }),
    )
  }

  const handleFamilyToggle = (
    family: ExerciseFamilyForLibrary<ExerciseLibraryFilterRow>,
  ) => {
    if (!exercises) return
    const selectionMembers = familyMembersForLibrarySelection(family)
    if (libraryFamilySelectionState(selectionMembers, isSelected) === 'full') {
      for (const m of selectionMembers) {
        removeExercise(m.id)
      }
      return
    }
    for (const m of selectionMembers) {
      addLibraryVariant(m.id)
    }
  }

  const handleDirectionToggle = (
    family: ExerciseFamilyForLibrary<ExerciseLibraryFilterRow>,
    side: NearTermDirection,
  ) => {
    const member = familyMemberForNearTermDirection(family, side)
    if (!member) return
    if (isSelected?.[member.id]) {
      removeExercise(member.id)
      return
    }
    addLibraryVariant(member.id)
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
    !isLoading && exercises && displayedFamilies?.length === 0

  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-2'>
      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-bold'>Select By Body Part</h2>
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
        <h2 className='text-lg font-bold'>Select By Equipment</h2>
        <div className='mb-3 flex flex-wrap gap-2'>
          {equipmentKeys?.map((key) => {
            const selected = selectedEquipmentKeys.includes(key)
            const iconSrc = equipmentIconSrcForItem(key)

            return (
              <Button
                key={key}
                type='button'
                size='sm'
                variant='outline'
                aria-pressed={selected}
                onClick={() => toggleEquipment(key)}
                className={cn(
                  'flex h-auto flex-col items-center gap-2 py-1.5',
                  selected && 'ring-cyan-highlight ring-2',
                )}
              >
                {iconSrc ? (
                  <Image
                    src={iconSrc}
                    alt={key}
                    width={400}
                    height={400}
                    className='size-18 shrink-0'
                  />
                ) : null}
                {equipmentChipLabel(key)}
              </Button>
            )
          })}
        </div>
      </div>

      <div className='mb-3 flex max-w-lg flex-wrap items-start gap-2'>
        <div className='relative min-w-48 flex-1'>
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
          <span>Favorites</span>
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
          displayedFamilies?.map((family) => {
            const selectionMembers = familyMembersForLibrarySelection(family)
            const selectionState = libraryFamilySelectionState(
              selectionMembers,
              isSelected ?? undefined,
            )
            const rep = family.representative
            const familyFavoriteTargets = selectionMembers.map((m) => ({
              exerciseId: m.id,
              favoriteRowId: favoriteRowIdByExerciseId.get(m.id) ?? null,
            }))
            return (
              <FlipCard
                key={family.familyKey}
                exercise={rep}
                footerTitle={family.familyKey}
                directionBadges={directionBadgesWithSelection(
                  family,
                  isSelected,
                )}
                isSelected={selectionState === 'full'}
                isPartiallySelected={selectionState === 'partial'}
                familyFavoriteTargets={familyFavoriteTargets}
                onDirectionBadgeClick={(side) =>
                  handleDirectionToggle(family, side)
                }
                onSelect={() => handleFamilyToggle(family)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

export default ExerciseGrid
