import { hasEnabledVariantsForSubmit } from './program-submit-enabled-variants'

/** Primary action on the quick start selected-list step: load the session. */
export const QUICKSTART_FINALIZE_LABEL = 'Finalize'

/** Finalize and Save Program require at least one non-deferred variant. */
export function canQuickStartFinalAction(
  variants: readonly { id: string }[],
  deferredRemovalIds: readonly string[],
): boolean {
  return hasEnabledVariantsForSubmit(variants, deferredRemovalIds)
}
