import { normalizeExerciseEquipmentKey } from './normalize-exercise-equipment-key.ts'
import {
  exerciseLibrarySearchText,
  type ExerciseLibraryFilterParams,
  type ExerciseLibraryFilterRow,
} from './filter-exercises-for-library.ts'

/** Near-term product assumption: only Left/Right participate in badge UI. */
export type NearTermDirection = 'Left' | 'Right'

export type DirectionBadgeHighlight = {
  side: NearTermDirection
  /** True when the active search term references this side (word-boundary match). */
  emphasized: boolean
  /** True when this variant is in the program draft (library cards, GitHub #13). */
  selected?: boolean
}

export type ExerciseFamilyForLibrary<T extends ExerciseLibraryFilterRow> = {
  /** Family key for V1: `displayName` (see PRD family-first selection). */
  familyKey: string
  /** All variants in this family from the catalog slice passed in, sorted by `name`. */
  members: T[]
  /** Distinct Left/Right directions present on members. */
  availableDirections: NearTermDirection[]
  /** First member by `name` — preview image, video, description, favorite affordance. */
  representative: T
  directionBadges: DirectionBadgeHighlight[]
}

export function parseNearTermDirection(
  direction: string,
): NearTermDirection | null {
  const t = direction.trim().toLowerCase()
  if (t === 'left') return 'Left'
  if (t === 'right') return 'Right'
  return null
}

/**
 * Variants to add/remove when toggling a family card in the library (PRD #5,
 * GitHub #7). When both Left and Right exist in the family, Dual-Side Auto-Add
 * applies to near-term directions only; other directions on the same
 * `displayName` are not bundled into that one click.
 */
export function familyMemberForNearTermDirection<
  T extends ExerciseLibraryFilterRow,
>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members'>,
  side: NearTermDirection,
): T | undefined {
  return family.members.find(
    (m) => parseNearTermDirection(m.direction) === side,
  )
}

/**
 * How many library-selection variants in a family are in the draft.
 * `partial` vs `full` affects family-card toggle behavior; card highlight uses
 * the same treatment for both (GitHub #122).
 */
export function libraryFamilySelectionState(
  members: readonly { id: string }[],
  isSelected: Readonly<Record<string, boolean>> | null | undefined,
): 'none' | 'partial' | 'full' {
  if (members.length === 0) return 'none'
  let selected = 0
  for (const m of members) {
    if (isSelected?.[m.id]) selected++
  }
  if (selected === 0) return 'none'
  if (selected === members.length) return 'full'
  return 'partial'
}

export function familyMembersForLibrarySelection<
  T extends ExerciseLibraryFilterRow,
>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members' | 'availableDirections'>,
): readonly T[] {
  const bilateral =
    family.availableDirections.includes('Left') &&
    family.availableDirections.includes('Right')
  if (!bilateral) return family.members
  return family.members.filter(
    (m) => parseNearTermDirection(m.direction) !== null,
  )
}

function collectNearTermDirections<T extends ExerciseLibraryFilterRow>(
  members: readonly T[],
): NearTermDirection[] {
  const set = new Set<NearTermDirection>()
  for (const m of members) {
    const d = parseNearTermDirection(m.direction)
    if (d) set.add(d)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

function searchMentionsLeft(searchTerm: string): boolean {
  return /\bleft\b/i.test(searchTerm.trim())
}

function searchMentionsRight(searchTerm: string): boolean {
  return /\bright\b/i.test(searchTerm.trim())
}

function buildDirectionBadges(
  available: readonly NearTermDirection[],
  searchTerm: string,
): DirectionBadgeHighlight[] {
  const mentionL = searchMentionsLeft(searchTerm)
  const mentionR = searchMentionsRight(searchTerm)
  return available.map((side) => ({
    side,
    emphasized: (side === 'Left' && mentionL) || (side === 'Right' && mentionR),
  }))
}

/**
 * Group exercise rows into families keyed by `displayName` (Family Key V1).
 */
export function groupExercisesIntoFamiliesByDisplayName<
  T extends ExerciseLibraryFilterRow,
>(exercises: readonly T[]): ExerciseFamilyForLibrary<T>[] {
  const byKey = new Map<string, T[]>()
  for (const e of exercises) {
    const k = e.displayName
    const arr = byKey.get(k) ?? []
    arr.push(e)
    byKey.set(k, arr)
  }
  const out: ExerciseFamilyForLibrary<T>[] = []
  for (const [familyKey, members] of byKey) {
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name))
    const availableDirections = collectNearTermDirections(sorted)
    out.push({
      familyKey,
      members: sorted,
      availableDirections,
      representative: sorted[0]!,
      directionBadges: availableDirections.map((side) => ({
        side,
        emphasized: false,
      })),
    })
  }
  return out.sort((a, b) =>
    a.representative.name.localeCompare(b.representative.name),
  )
}

function familyMatchesSearch<T extends ExerciseLibraryFilterRow>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members'>,
  search: string,
): boolean {
  if (search.length === 0) return true
  return family.members.some((m) =>
    exerciseLibrarySearchText(m).includes(search),
  )
}

function familyMatchesBody<T extends ExerciseLibraryFilterRow>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members'>,
  selectedBodyParts: readonly string[],
): boolean {
  if (selectedBodyParts.length === 0) return true
  const body = new Set(selectedBodyParts)
  return family.members.some((m) => body.has(m.category))
}

function familyMatchesEquipment<T extends ExerciseLibraryFilterRow>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members'>,
  selectedEquipmentKeys: readonly string[],
): boolean {
  if (selectedEquipmentKeys.length === 0) return true
  const equip = new Set(
    selectedEquipmentKeys.map((k) => normalizeExerciseEquipmentKey(k)),
  )
  return family.members.some((m) =>
    equip.has(normalizeExerciseEquipmentKey(m.item)),
  )
}

function familyMatchesFavorites<T extends ExerciseLibraryFilterRow>(
  family: Pick<ExerciseFamilyForLibrary<T>, 'members'>,
  favoritesOnly: boolean,
  favoriteExerciseIds: Iterable<string>,
): boolean {
  if (!favoritesOnly) return true
  const favoriteSet = new Set(favoriteExerciseIds)
  return family.members.some((m) => favoriteSet.has(m.id))
}

/**
 * Filter exercise **families** for the library grid: same AND/OR semantics as
 * {@link filterExercisesForLibrary} on variants, but one row per `displayName`
 * and direction-aware search keeps the whole family visible when any side matches.
 */
export function filterExerciseFamiliesForLibrary<
  T extends ExerciseLibraryFilterRow,
>(
  exercises: readonly T[],
  {
    selectedBodyParts,
    selectedEquipmentKeys,
    searchTerm,
    favoritesOnly,
    favoriteExerciseIds,
  }: ExerciseLibraryFilterParams,
): ExerciseFamilyForLibrary<T>[] {
  const search = searchTerm.trim().toLowerCase()
  const families = groupExercisesIntoFamiliesByDisplayName(exercises)
  return families
    .filter(
      (f) =>
        familyMatchesBody(f, selectedBodyParts) &&
        familyMatchesEquipment(f, selectedEquipmentKeys) &&
        familyMatchesFavorites(f, favoritesOnly, favoriteExerciseIds) &&
        familyMatchesSearch(f, search),
    )
    .map((f) => ({
      ...f,
      directionBadges: buildDirectionBadges(f.availableDirections, searchTerm),
    }))
}
