import {
  isDeferredRemoval,
  toDeferredRemovalIdSet,
} from './program-list-deferred-removal'

export const ZERO_ENABLED_VARIANTS_MESSAGE =
  'You need to add at least one exercise.'

/** Exercise variants persisted on program submit — excludes deferred-removal rows. */
export function enabledVariantsForSubmit<T extends { id: string }>(
  variants: readonly T[],
  deferredRemovalIds: readonly string[],
): T[] {
  const deferred = toDeferredRemovalIdSet(deferredRemovalIds)

  return variants.filter(
    (variant) => !isDeferredRemoval(deferred, variant.id),
  )
}

export function hasEnabledVariantsForSubmit<T extends { id: string }>(
  variants: readonly T[],
  deferredRemovalIds: readonly string[],
): boolean {
  return enabledVariantsForSubmit(variants, deferredRemovalIds).length > 0
}

/** Program-edit submit rows — enabled variants with `programId` attached. */
export function programExercisesForEditSubmit<T extends { id: string }>(
  variants: readonly T[],
  deferredRemovalIds: readonly string[],
  programId: string,
): Array<T & { programId: string }> {
  return enabledVariantsForSubmit(variants, deferredRemovalIds).map((variant) => ({
    ...variant,
    programId,
  }))
}
