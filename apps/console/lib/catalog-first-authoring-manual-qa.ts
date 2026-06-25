/**
 * Manual QA checklist for catalog-first program authoring (PRD #98, issue #108).
 * Covers browser verification for each target flow after rollout.
 */

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
        'Selected exercise count appears near Next; Next works with zero selections',
        'Second step shows selected-list settings with Continue and Save Program',
        'Continue and Save Program are disabled when no enabled variants remain',
        'Back returns to the catalog without clearing selections',
        'No nested Exercise Library button or dialog appears in either step',
      ],
    },
    {
      id: 'scratch-create',
      label: 'Scratch Reusable Program create',
      entry: 'Program Library → Create program → Create your own program',
      checks: [
        'Editor opens on the exercise catalog step',
        'Program name field is hidden on the catalog step',
        'Next proceeds to selected-list/settings; Back returns to catalog',
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
        'Editor opens on the catalog with template exercises pre-selected',
        'Suggested template name appears only on the selected-list step',
        'Back from selected-list returns to catalog with selections preserved',
        'Submit is blocked when no enabled variants remain',
      ],
    },
    {
      id: 'reusable-program-edit',
      label: 'Reusable Program edit',
      entry: 'Program Library → Edit on an existing reusable program',
      checks: [
        'Editor opens on the catalog with existing exercises pre-selected',
        'Program name appears only on the selected-list step',
        'Back from selected-list returns to catalog with selections preserved',
        'Update is blocked when no enabled variants remain',
        'No Exercise Library button on the selected-list step',
      ],
    },
  ] as const
