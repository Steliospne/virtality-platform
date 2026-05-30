import {
  PROMOTED_COMPONENTS,
  canonicalSharedImport,
} from '@virtality/ui/contract'

function canonicalImportMessage(name) {
  return `Import promoted UI from '${canonicalSharedImport(name)}' (Canonical Shared UI Import).`
}

const restrictedPaths = PROMOTED_COMPONENTS.flatMap((name) => [
  {
    name: `@/components/ui/${name}`,
    message: canonicalImportMessage(name),
  },
])

const restrictedPatterns = PROMOTED_COMPONENTS.map((name) => ({
  group: [`**/components/ui/${name}`, `**/ui/${name}`],
  message: canonicalImportMessage(name),
}))

/**
 * ESLint rules enforcing Canonical Shared UI Import for promoted components.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedPaths,
          patterns: restrictedPatterns,
        },
      ],
    },
  },
]
