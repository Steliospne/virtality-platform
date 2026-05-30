import { MouseEvent, useMemo, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FolderClosed,
  Settings,
  Trash2,
} from 'lucide-react'
import { Label } from '@virtality/ui/components/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
  copyProgramExerciseFields,
  programExerciseFieldsDiverge,
} from '@/lib/program-exercise-pair-fields'
import { removalDiscardsDivergentBilateralWork } from '@/lib/program-list-removal-safety'
import {
  parseNearTermDirection,
  segmentProgramExerciseRowsByAdjacentBilateralFamilies,
  type NearTermDirection,
  type ProgramExerciseListSegment,
} from '@virtality/shared/utils'
import type { Exercise } from '@virtality/db'

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
  selectedExercises: CompleteExercise[],
  seg: ProgramExerciseListSegment,
): CompleteExercise[] {
  if (seg.kind === 'single') {
    return [selectedExercises[seg.startIndex]!]
  }
  return [
    selectedExercises[seg.startIndex]!,
    selectedExercises[seg.startIndex + 1]!,
  ]
}

/** Radix checkbox `checked` when a segment is all, partly, or not selected. */
function segmentCheckboxChecked(
  allMembersSelected: boolean,
  someMembersSelected: boolean,
): boolean | 'indeterminate' {
  if (allMembersSelected) return true
  if (someMembersSelected) return 'indeterminate'
  return false
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

type ProgramDirectionToggleParams = {
  side: NearTermDirection
  displayName: string
  anchorIndex: number
  members: CompleteExercise[]
  isPair: boolean
  splitSides: boolean
  primary: CompleteExercise
  secondary: CompleteExercise | undefined
}

function segmentExpandedSettings({
  open,
  isPair,
  splitSides,
  primary,
  secondary,
  primaryIndex,
  secondaryIndex,
  selectedExercises,
  selectedItems,
  updateExercises,
}: {
  open: boolean
  isPair: boolean
  splitSides: boolean
  primary: CompleteExercise
  secondary: CompleteExercise | undefined
  primaryIndex: number
  secondaryIndex: number | undefined
  selectedExercises: CompleteExercise[]
  selectedItems: string[]
  updateExercises: (exercises: CompleteExercise[]) => void
}): ReactNode {
  if (!open) return null
  if (isPair && splitSides && secondary != null && secondaryIndex != null) {
    return (
      <div className='flex w-full flex-col gap-4'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs font-medium'>Left</p>
          <ExerciseSettings
            key={`${primary.id}-left`}
            ex={primary}
            exercises={selectedExercises}
            selectedItems={selectedItems}
            index={primaryIndex}
            setExercises={updateExercises}
          />
        </div>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs font-medium'>Right</p>
          <ExerciseSettings
            key={`${secondary.id}-right`}
            ex={secondary}
            exercises={selectedExercises}
            selectedItems={selectedItems}
            index={secondaryIndex}
            setExercises={updateExercises}
          />
        </div>
      </div>
    )
  }
  return (
    <ExerciseSettings
      key={primary.id}
      ex={primary}
      exercises={selectedExercises}
      selectedItems={selectedItems}
      index={primaryIndex}
      unifiedSiblingIndex={secondaryIndex}
      setExercises={updateExercises}
    />
  )
}

const ExerciseLibraryList = ({ className }: ExerciseLibraryListProps) => {
  const { state, handler } = useExerciseLibrary()
  const { data: defaultExercises } = useExercise()
  const { selectedExercises, globalCheck, toggledSettings, selectedItems } =
    state

  const [splitSidesByPairKey, setSplitSidesByPairKey] = useState<
    Record<string, boolean>
  >({})

  const {
    setLibraryOpen,
    setToggledSettings,
    updateExercises,
    updateFormState,
    removeExercise,
  } = handler

  const commitSelectedItems = (nextSelectedItems: string[]) => {
    updateFormState({
      selectedItems: nextSelectedItems,
      globalCheck: nextSelectedItems.length === selectedExercises.length,
    })
  }

  const segments = useMemo(
    () =>
      segmentProgramExerciseRowsByAdjacentBilateralFamilies(
        selectedExercises.map(segmentRowKey),
      ),
    [selectedExercises],
  )

  const toggleSettings = (e: MouseEvent) => {
    const { id } = e.currentTarget
    if (!id) return

    if (!toggledSettings) setToggledSettings({ [id]: true })
    else setToggledSettings({ [id]: !toggledSettings[id] })
  }

  const checkboxChange = (exercise: ExerciseWithSettings) => {
    const itemExists = selectedItems.find((item) => item === exercise.id)

    if (itemExists) {
      commitSelectedItems(selectedItems.filter((item) => item !== exercise.id))
    } else {
      commitSelectedItems([...selectedItems, exercise.id])
    }
  }

  const pairCheckboxChange = (memberIds: readonly string[]) => {
    const allIn = memberIds.every((id) => selectedItems.includes(id))
    if (allIn) {
      commitSelectedItems(
        selectedItems.filter((id) => !memberIds.includes(id)),
      )
    } else {
      commitSelectedItems([...new Set([...selectedItems, ...memberIds])])
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
    const idsToRemove = new Set(selectedItems)
    if (
      removalDiscardsDivergentBilateralWork(
        selectedExercises,
        segments,
        idsToRemove,
      )
    ) {
      const ok = window.confirm(
        'Remove the selected exercises? Side-specific settings for a Left/Right pair will be discarded.',
      )
      if (!ok) return
    }
    const exercisesToUpdate = selectedExercises.filter(
      (ex) => !idsToRemove.has(ex.id),
    )
    updateExercises(exercisesToUpdate)
    updateFormState({ globalCheck: false, selectedItems: [] })
  }

  const reorderSegmentGroups = (groupIndex: number, delta: -1 | 1) => {
    const j = groupIndex + delta
    if (j < 0 || j >= segments.length) return
    const groups = segments.map((s) =>
      membersForSegment(selectedExercises, s),
    )
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
    isPair,
    splitSides,
    primary,
    secondary,
  }: ProgramDirectionToggleParams) => {
    const inProgram = programMemberForDirection(members, side)
    if (inProgram) {
      if (
        isPair &&
        splitSides &&
        secondary &&
        programExerciseFieldsDiverge(primary, secondary)
      ) {
        const ok = window.confirm(
          'Remove this side? Side-specific settings for the Left/Right pair will be discarded.',
        )
        if (!ok) return
      }
      removeExercise(inProgram.exerciseId)
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
      insertBilateralSiblingRow(selectedExercises, anchorIndex, side, newRow),
    )
  }

  const handlePairSplitSidesChange = (
    pairKey: string,
    primaryIndex: number,
    secondaryIndex: number,
    split: boolean,
  ) => {
    setSplitSidesByPairKey((prev) => ({ ...prev, [pairKey]: split }))
    if (!split) {
      const primary = selectedExercises[primaryIndex]!
      const secondary = selectedExercises[secondaryIndex]!
      if (programExerciseFieldsDiverge(primary, secondary)) {
        updateExercises(
          selectedExercises.map((ex, i) =>
            i === secondaryIndex
              ? copyProgramExerciseFields(secondary, primary)
              : ex,
          ),
        )
      }
    }
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
          segments.map((seg, groupIdx) => {
            const members = membersForSegment(selectedExercises, seg)
            const isPair = seg.kind === 'bilateral'
            const primary = members[0]!
            const secondary = members[1]
            const primaryIndex = seg.startIndex
            const secondaryIndex = isPair ? seg.startIndex + 1 : undefined

            const memberIds = members.map((m) => m.id)
            const allMembersSelected = memberIds.every((id) =>
              selectedItems.includes(id),
            )
            const someMembersSelected = memberIds.some((id) =>
              selectedItems.includes(id),
            )

            const primaryCatalog = defaultExercises?.find(
              (de) => de.id === primary.exerciseId,
            )

            const familyDisplayName =
              primary.exercise?.displayName ??
              primaryCatalog?.displayName ??
              ''
            const showDirectionToggles = catalogHasBilateralDirections(
              defaultExercises,
              familyDisplayName,
            )

            const rowTitle = isPair
              ? familyDisplayName || 'Exercise'
              : (getDisplayName(primaryCatalog) ?? 'Exercise')

            const listKey = isPair ? `${primary.id}:${secondary!.id}` : primary.id
            const splitSides = splitSidesByPairKey[listKey] ?? false

            const expandedSettings = segmentExpandedSettings({
              open: Boolean(toggledSettings?.[primary.id]),
              isPair,
              splitSides,
              primary,
              secondary,
              primaryIndex,
              secondaryIndex,
              selectedExercises,
              selectedItems,
              updateExercises,
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
                  className='flex flex-col'
                >
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      checked={segmentCheckboxChecked(
                        allMembersSelected,
                        someMembersSelected,
                      )}
                      onCheckedChange={() =>
                        isPair
                          ? pairCheckboxChange(memberIds)
                          : checkboxChange(primary)
                      }
                    />
                    <div className='flex flex-1 flex-col'>
                      <p>{rowTitle}</p>
                      {showDirectionToggles ? (
                        <div className='mt-0.5 flex flex-wrap gap-1'>
                          {NEAR_TERM_SIDES.map((side) => {
                            const inProgram = Boolean(
                              programMemberForDirection(members, side),
                            )
                            return (
                              <button
                                key={side}
                                type='button'
                                aria-pressed={inProgram}
                                aria-label={`${inProgram ? 'Remove' : 'Add'} ${side} variant`}
                                className={cn(
                                  'text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-medium',
                                  inProgram &&
                                    'text-foreground border-cyan-500/60 bg-cyan-500/20',
                                )}
                                onClick={() =>
                                  toggleProgramDirection({
                                    side,
                                    displayName: familyDisplayName,
                                    anchorIndex: primaryIndex,
                                    members,
                                    isPair,
                                    splitSides,
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
                      {isPair ? (
                        <div className='mt-1 flex w-full max-w-md items-center justify-between gap-2'>
                          <Label
                            htmlFor={`split-${listKey}`}
                            className='text-muted-foreground cursor-pointer text-xs font-normal'
                          >
                            Edit sides separately
                          </Label>
                          <Switch
                            id={`split-${listKey}`}
                            checked={splitSides}
                            onCheckedChange={(c) =>
                              handlePairSplitSidesChange(
                                listKey,
                                primaryIndex,
                                secondaryIndex!,
                                Boolean(c),
                              )
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                    <Button
                      id={primary.id}
                      type='button'
                      size='icon'
                      variant='outline'
                      onClick={toggleSettings}
                    >
                      <Settings className='size-4' />
                    </Button>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='flex flex-col'>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => reorderSegmentGroups(groupIdx, -1)}
                        disabled={groupIdx === 0}
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        onClick={() => reorderSegmentGroups(groupIdx, 1)}
                        disabled={groupIdx === segments.length - 1}
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
