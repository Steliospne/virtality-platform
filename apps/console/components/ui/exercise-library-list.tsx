import { useMemo, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, FolderClosed, Trash2 } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@virtality/ui/components/separator'
import { cn, getDisplayName, getUUID } from '@/lib/utils'
import { withRom } from '@/lib/with-rom'
import { insertBilateralSiblingRow } from '@/lib/program-list-bilateral-insert'
import ExerciseSettings from '@/components/ui/exercise-settings'
import { CompleteExercise, ExerciseWithSettings } from '@/types/models'
import ExerciseLibraryDialog from '@/components/ui/exercise-library-dialog'
import { P } from './typography'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { motion } from 'motion/react'
import { useExercise } from '@virtality/react-query'

import {
  parseNearTermDirection,
  segmentProgramExerciseRowsByAdjacentBilateralFamilies,
  type NearTermDirection,
  type ProgramExerciseListSegment,
} from '@virtality/shared/utils'
import type { Exercise } from '@virtality/db'
import {
  bulkSelectableRowIds,
  enabledMemberIds,
  isDeferredRemoval,
  isGlobalCheckSatisfied,
  segmentCheckboxChecked,
  segmentMembersFullyDeferred,
  toDeferredRemovalIdSet,
  type DeferredRemovalIdSet,
} from '@/lib/program-list-deferred-removal'

interface ExerciseLibraryListProps {
  className?: string
}

function segmentRowKey(ex: CompleteExercise): {
  displayName: string
  direction: string
} {
  return {
    displayName: ex.exercise?.displayName ?? '',
    direction: ex.exercise?.direction ?? '',
  }
}

function membersForSegment(
  exerciseList: CompleteExercise[],
  seg: ProgramExerciseListSegment,
): CompleteExercise[] {
  if (seg.kind === 'single') {
    return [exerciseList[seg.startIndex]!]
  }
  return [exerciseList[seg.startIndex]!, exerciseList[seg.startIndex + 1]!]
}

const NEAR_TERM_SIDES: NearTermDirection[] = ['Left', 'Right']

function catalogHasBilateralDirections(
  catalog: Exercise[] | undefined,
  displayName: string,
): boolean {
  const dirs = new Set<NearTermDirection>()
  for (const e of catalog ?? []) {
    if (e.displayName !== displayName) continue
    const d = parseNearTermDirection(e.direction)
    if (d) dirs.add(d)
  }
  return dirs.has('Left') && dirs.has('Right')
}

function catalogVariantForDirection(
  catalog: Exercise[] | undefined,
  displayName: string,
  side: NearTermDirection,
): Exercise | undefined {
  return catalog?.find(
    (e) =>
      e.displayName === displayName &&
      parseNearTermDirection(e.direction) === side,
  )
}

function programMemberForDirection(
  members: readonly CompleteExercise[],
  side: NearTermDirection,
): CompleteExercise | undefined {
  return members.find(
    (m) => parseNearTermDirection(m.exercise?.direction ?? '') === side,
  )
}

function directionToggleAriaLabel(
  isEnabled: boolean,
  inProgram: boolean,
  side: NearTermDirection,
): string {
  if (isEnabled) return `Remove ${side} variant`
  if (inProgram) return `Restore ${side} variant`
  return `Add ${side} variant`
}

type ProgramDirectionToggleParams = {
  side: NearTermDirection
  displayName: string
  anchorIndex: number
  members: CompleteExercise[]
  isPair: boolean
  primary: CompleteExercise
  secondary: CompleteExercise | undefined
}

function segmentExpandedSettings({
  isPair,
  primary,
  secondary,
  primaryIndex,
  secondaryIndex,
  exerciseList,
  selectedItems,
  updateExercises,
  deferredRemoval,
}: {
  isPair: boolean
  primary: CompleteExercise
  secondary: CompleteExercise | undefined
  primaryIndex: number
  secondaryIndex: number | undefined
  exerciseList: CompleteExercise[]
  selectedItems: string[]
  updateExercises: (exercises: CompleteExercise[]) => void
  deferredRemoval: DeferredRemovalIdSet
}): ReactNode {
  const primaryDeferred = isDeferredRemoval(deferredRemoval, primary.id)
  const secondaryDeferred =
    secondary != null && isDeferredRemoval(deferredRemoval, secondary.id)

  if (isPair && secondary != null && secondaryIndex != null) {
    return (
      <div className='flex w-full flex-col gap-4'>
        <div
          className={cn('space-y-1', primaryDeferred && 'opacity-50')}
        >
          <p className='text-muted-foreground text-xs font-medium'>Left</p>
          <ExerciseSettings
            key={`${primary.id}-left`}
            ex={primary}
            exercises={exerciseList}
            selectedItems={selectedItems}
            index={primaryIndex}
            setExercises={updateExercises}
            readOnly={primaryDeferred}
          />
        </div>
        <div
          className={cn('space-y-1', secondaryDeferred && 'opacity-50')}
        >
          <p className='text-muted-foreground text-xs font-medium'>Right</p>
          <ExerciseSettings
            key={`${secondary.id}-right`}
            ex={secondary}
            exercises={exerciseList}
            selectedItems={selectedItems}
            index={secondaryIndex}
            setExercises={updateExercises}
            readOnly={secondaryDeferred}
          />
        </div>
      </div>
    )
  }
  return (
    <div className={cn('space-y-1', primaryDeferred && 'opacity-50')}>
      <p className='text-muted-foreground text-xs font-medium'>
        {primary.exercise?.direction}
      </p>

      <ExerciseSettings
        key={primary.id}
        ex={primary}
        exercises={exerciseList}
        selectedItems={selectedItems}
        index={primaryIndex}
        unifiedSiblingIndex={secondaryIndex}
        setExercises={updateExercises}
        readOnly={primaryDeferred}
      />
    </div>
  )
}

const ExerciseLibraryList = ({ className }: ExerciseLibraryListProps) => {
  const { state, handler } = useExerciseLibrary()
  const { data: defaultExercises } = useExercise()
  const { selectedExercises, globalCheck, selectedItems, deferredRemovalIds } =
    state

  const deferredRemoval = toDeferredRemovalIdSet(deferredRemovalIds)

  const {
    setLibraryOpen,
    updateExercises,
    updateFormState,
    markDeferredRemoval,
    unmarkDeferredRemoval,
  } = handler

  const exerciseList = useMemo(() => {
    return selectedExercises.map((ex) => ({
      ...ex,
      exercise: defaultExercises?.find((de) => de.id === ex.exerciseId),
    }))
  }, [selectedExercises, defaultExercises])

  const commitSelectedItems = (nextSelectedItems: string[]) => {
    updateFormState({
      selectedItems: nextSelectedItems,
      globalCheck: isGlobalCheckSatisfied(
        exerciseList,
        nextSelectedItems,
        deferredRemoval,
      ),
    })
  }

  const segments = useMemo(
    () =>
      segmentProgramExerciseRowsByAdjacentBilateralFamilies(
        exerciseList.map(segmentRowKey),
      ),
    [exerciseList],
  )

  const checkboxChange = (exercise: ExerciseWithSettings) => {
    const itemExists = selectedItems.find((item) => item === exercise.id)

    if (itemExists) {
      commitSelectedItems(selectedItems.filter((item) => item !== exercise.id))
    } else {
      commitSelectedItems([...selectedItems, exercise.id])
    }
  }

  const pairCheckboxChange = (memberIds: readonly string[]) => {
    const selectableIds = enabledMemberIds(memberIds, deferredRemoval)
    const allIn = selectableIds.every((id) => selectedItems.includes(id))
    if (allIn) {
      commitSelectedItems(
        selectedItems.filter((id) => !selectableIds.includes(id)),
      )
    } else {
      commitSelectedItems([...new Set([...selectedItems, ...selectableIds])])
    }
  }

  const checkAll = (checked: boolean) => {
    const selectableIds = bulkSelectableRowIds(exerciseList, deferredRemoval)
    const newSelectedItems = checked ? selectableIds : []
    updateFormState({
      selectedItems: newSelectedItems,
      globalCheck: checked && selectableIds.length > 0,
    })
  }

  const deleteSelected = () => {
    const idsToRemove = new Set(selectedItems)

    const exercisesToUpdate = exerciseList.filter(
      (ex) => !idsToRemove.has(ex.id),
    )
    updateExercises(exercisesToUpdate)
    updateFormState({ globalCheck: false, selectedItems: [] })
  }

  const reorderSegmentGroups = (groupIndex: number, delta: -1 | 1) => {
    const j = groupIndex + delta
    if (j < 0 || j >= segments.length) return
    const groups = segments.map((s) => membersForSegment(exerciseList, s))
    const reordered = [...groups]
    ;[reordered[groupIndex], reordered[j]] = [
      reordered[j]!,
      reordered[groupIndex]!,
    ]
    updateExercises(reordered.flat())
  }

  const toggleProgramDirection = ({
    side,
    displayName,
    anchorIndex,
    members,
  }: ProgramDirectionToggleParams) => {
    const inProgram = programMemberForDirection(members, side)
    if (inProgram) {
      if (isDeferredRemoval(deferredRemoval, inProgram.id)) {
        unmarkDeferredRemoval(inProgram.id)
      } else {
        markDeferredRemoval(inProgram.id)
      }
      return
    }
    const catalogEx = catalogVariantForDirection(
      defaultExercises,
      displayName,
      side,
    )
    if (!catalogEx) return
    const newRow = withRom({
      exerciseId: catalogEx.id,
      id: getUUID(),
      reps: 10,
      sets: 3,
      restTime: 5,
      holdTime: 1,
      speed: 1.0,
      exercise: catalogEx,
    })
    updateExercises(
      insertBilateralSiblingRow(exerciseList, anchorIndex, side, newRow),
    )
  }

  const isListEmpty = exerciseList.length === 0

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
          segments.map((seg, groupIdx) => {
            const members = membersForSegment(exerciseList, seg)
            const isPair = seg.kind === 'bilateral'
            const primary = members[0]!
            const secondary = members[1]
            const primaryIndex = seg.startIndex
            const secondaryIndex = isPair ? seg.startIndex + 1 : undefined

            const memberIds = members.map((m) => m.id)
            const selectableMemberIds = enabledMemberIds(
              memberIds,
              deferredRemoval,
            )
            const fullyDeferred = segmentMembersFullyDeferred(
              memberIds,
              deferredRemoval,
            )

            const primaryCatalog = defaultExercises?.find(
              (de) => de.id === primary.exerciseId,
            )

            const familyDisplayName =
              primary.exercise?.displayName ?? primaryCatalog?.displayName ?? ''
            const showDirectionToggles = catalogHasBilateralDirections(
              defaultExercises,
              familyDisplayName,
            )

            const rowTitle = familyDisplayName || 'Exercise'

            const listKey = isPair
              ? `${primary.id}:${secondary!.id}`
              : primary.id

            const expandedSettings = segmentExpandedSettings({
              isPair,
              primary,
              secondary,
              primaryIndex,
              secondaryIndex,
              exerciseList,
              selectedItems,
              updateExercises,
              deferredRemoval,
            })

            return (
              <li key={listKey} className='space-y-2'>
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
                  className={cn('flex flex-col', fullyDeferred && 'opacity-50')}
                >
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      checked={segmentCheckboxChecked(
                        memberIds,
                        selectedItems,
                        deferredRemoval,
                      )}
                      disabled={selectableMemberIds.length === 0}
                      onCheckedChange={() =>
                        isPair
                          ? pairCheckboxChange(memberIds)
                          : checkboxChange(primary)
                      }
                    />
                    <div className='flex flex-1 gap-2 p-1'>
                      <p>{rowTitle}</p>
                      {showDirectionToggles ? (
                        <div className='mt-0.5 flex flex-wrap gap-1'>
                          {NEAR_TERM_SIDES.map((side) => {
                            const member = programMemberForDirection(members, side)
                            const inProgram = member != null
                            const isEnabled =
                              inProgram &&
                              !isDeferredRemoval(deferredRemoval, member.id)
                            return (
                              <button
                                key={side}
                                type='button'
                                aria-pressed={isEnabled}
                                aria-label={directionToggleAriaLabel(
                                  isEnabled,
                                  inProgram,
                                  side,
                                )}
                                className={cn(
                                  'text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-medium',
                                  isEnabled &&
                                    'text-foreground animate-pulse border-cyan-500/60 bg-cyan-500/20',
                                )}
                                onClick={() =>
                                  toggleProgramDirection({
                                    side,
                                    displayName: familyDisplayName,
                                    anchorIndex: primaryIndex,
                                    members,
                                    isPair,
                                    primary,
                                    secondary,
                                  })
                                }
                              >
                                {side}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='flex flex-col'>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => reorderSegmentGroups(groupIdx, -1)}
                        disabled={fullyDeferred || groupIdx === 0}
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => reorderSegmentGroups(groupIdx, 1)}
                        disabled={
                          fullyDeferred || groupIdx === segments.length - 1
                        }
                      >
                        <ChevronDown />
                      </Button>
                    </div>
                    <div className='flex-1'>{expandedSettings}</div>
                  </div>

                  {groupIdx === segments.length - 1 ? null : (
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
