/**
 * Shared path and regex seams for catalog-first authoring surface tests.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

export function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

export const PATIENT_DASHBOARD_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/patient-dashboard.tsx'

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

export const QUICKSTART_DIALOG_CONTENT_CLASS_ATTR =
  /<DialogContent className='([^']+)'/

export const QUICKSTART_CATALOG_GRID_WRAPPER_CLASS_ATTR =
  /isCatalogStep\s*\?[\s\S]*?<div className=\{scrollableStepContentClass\}>\s*<ExerciseGrid/

/** At least 70% viewport width (e.g. w-4/5 = 80%, w-3/4 = 75%). */
export const VIEWPORT_WIDTH_DIALOG_CLASS = /w-4\/5|w-3\/4|w-\[[7-8]\dvw\]/

/** Breakpoint-specific widths defeat consistent viewport-relative sizing. */
export const BREAKPOINT_SPECIFIC_WIDTH_CLASS = /\b(?:md|lg|xl|2xl):w-/

export function readQuickstartDialogContentClass(source: string): string {
  return source.match(QUICKSTART_DIALOG_CONTENT_CLASS_ATTR)?.[1] ?? ''
}

export function readQuickstartCatalogGridWrapperClass(source: string): string {
  if (QUICKSTART_CATALOG_GRID_WRAPPER_CLASS_ATTR.test(source)) {
    return (
      source.match(/const scrollableStepContentClass = '([^']+)'/)?.[1] ?? ''
    )
  }

  return (
    source.match(
      /isCatalogStep\s*\?[\s\S]*?<div className='([^']+)'>\s*<ExerciseGrid/,
    )?.[1] ?? ''
  )
}
