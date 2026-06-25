/**
 * Shared path and regex seams for catalog-first authoring surface tests.
 */

export const QUICKSTART_DIALOG_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/quickstart-dialog.tsx'

export const REUSABLE_PROGRAM_CREATE_FORM_PATH =
  'app/(app)/programs/new/_components/reusable-program-form.tsx'

export const REUSABLE_PROGRAM_CREATE_FLOW_PATH =
  'app/(app)/programs/new/_components/reusable-program-create-flow.tsx'

export const REUSABLE_PROGRAM_EDIT_FORM_PATH =
  'app/(app)/programs/[programId]/edit/_components/reusable-program-edit-form.tsx'

/** Selected-list surfaces that pass `showExerciseLibraryAccess={false}`. */
export const LEGACY_LIBRARY_ACCESS_DISABLED =
  /<ExerciseLibraryList[\s\S]*?showExerciseLibraryAccess=\{false\}/

/** Create-form surfaces that hide library access on the catalog-first selected-list step. */
export const LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST =
  /showExerciseLibraryAccess=\{!isCatalogFirstSelectedListStep\}/
