/** Canonical package name for the Shared UI Bucket. */
export const SHARED_UI_PACKAGE = '@virtality/ui' as const

/**
 * Phase-1 migration batch. Promotion slices (#16–#19) promote these in order;
 * enforcement (#20) applies once they are in {@link PROMOTED_COMPONENTS}.
 */
export const PHASE_1_COMPONENTS = [
  'label',
  'spinner',
  'input',
  'textarea',
  'separator',
  'badge',
  'card',
] as const

export type Phase1Component = (typeof PHASE_1_COMPONENTS)[number]

/**
 * Components that have completed promotion and must use canonical shared imports.
 * Updated by each promotion slice as components complete migration.
 */
export const PROMOTED_COMPONENTS: readonly Phase1Component[] = [
  'label',
  'spinner',
  'input',
  'textarea',
  'separator',
  'badge',
]

export type PromotedComponent = (typeof PROMOTED_COMPONENTS)[number]

export function isPhase1Component(name: string): name is Phase1Component {
  return (PHASE_1_COMPONENTS as readonly string[]).includes(name)
}

/** Canonical Shared UI Import path for a promoted component. */
export function canonicalSharedImport(
  component: Phase1Component | PromotedComponent,
): `${typeof SHARED_UI_PACKAGE}/components/${string}` {
  return `${SHARED_UI_PACKAGE}/components/${component}`
}
