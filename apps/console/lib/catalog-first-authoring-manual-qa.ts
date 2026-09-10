/**
 * Manual QA checklist for settings-first program authoring.
 * Covers browser verification for each target flow after rollout.
 */

import { CATALOG_FIRST_CATALOG_CONTINUE_LABEL } from './catalog-first-authoring-flow.js'
import { QUICKSTART_FINALIZE_LABEL } from './quickstart-authoring-flow.js'

export type CatalogFirstAuthoringManualQaFlow = {
  id: string
  label: string
  entry: string
  checks: readonly string[]
}

export const CATALOG_FIRST_AUTHORING_MANUAL_QA: readonly CatalogFirstAuthoringManualQaFlow[] =
  [
    {
      id: 'quick-start',
      label: 'Quick Start',
      entry: 'Patient dashboard → Quick Start',
      checks: [
        'Single dialog opens with the exercise catalog as the first step',
        `${CATALOG_FIRST_CATALOG_CONTINUE_LABEL} returns to settings (selected-list); Add exercises returns to catalog`,
        'Selected exercise count appears on the catalog step',
        `${QUICKSTART_FINALIZE_LABEL} and Save Program are disabled when no enabled variants remain`,
        `${QUICKSTART_FINALIZE_LABEL} opens a save reminder dialog before loading the session`,
        `Save reminder offers Save program (with name) or Continue without saving; Esc returns to selected-list`,
        'Navigating to catalog and back does not clear selections',
        'No nested Exercise Library button or dialog appears in either step',
      ],
    },
    {
      id: 'scratch-create',
      label: 'Scratch Reusable Program create',
      entry: 'Program Library → Create program → Create your own program',
      checks: [
        'Editor opens on the exercise catalog step',
        `${CATALOG_FIRST_CATALOG_CONTINUE_LABEL} returns to settings; program name field is visible on the settings step`,
        `Add exercises opens the catalog; ${CATALOG_FIRST_CATALOG_CONTINUE_LABEL}/Back returns to settings`,
        'Submit is blocked when no enabled variants remain',
        'No Exercise Library button on the selected-list step',
      ],
    },
    {
      id: 'starter-template-create',
      label: 'Starter Template create',
      entry: 'Program Library → Create program → Use a starter template',
      checks: [
        'Template picker appears before the editor',
        'Editor opens on settings with template exercises pre-selected',
        'Suggested template name appears on the selected-list step',
        `Add exercises opens the catalog; ${CATALOG_FIRST_CATALOG_CONTINUE_LABEL}/Back returns with selections preserved`,
        'Submit is blocked when no enabled variants remain',
      ],
    },
    {
      id: 'reusable-program-edit',
      label: 'Reusable Program edit',
      entry: 'Program Library → Edit on an existing reusable program',
      checks: [
        'Editor opens on settings with existing exercises pre-selected',
        'Program name appears on the selected-list step',
        `Add exercises opens the catalog; ${CATALOG_FIRST_CATALOG_CONTINUE_LABEL}/Back returns with selections preserved`,
        'Update is blocked when no enabled variants remain',
        'No Exercise Library button on the selected-list step',
      ],
    },
  ] as const
