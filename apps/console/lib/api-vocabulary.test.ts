import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

const REMOVED_PROGRAM_AND_PRESET_HOOKS = [
  'usePatientProgram',
  'usePatientPrograms',
  'usePreset',
  'usePresets',
  'usePresetsByUser',
  'useCreateProgram',
  'useUpdateProgram',
  'useDeleteProgram',
  'useCreatePreset',
  'useUpdatePreset',
  'useDeletePreset',
] as const

describe('clinician API vocabulary cleanup', () => {
  it('does not re-export removed patient-program or preset hooks from the main react-query entry', () => {
    const queryExports = readRepoFile(
      'packages/react-query/src/hooks/queries/index.ts',
    )
    const mutationExports = readRepoFile(
      'packages/react-query/src/hooks/mutations/index.ts',
    )
    const mainIndex = readRepoFile('packages/react-query/src/index.ts')

    for (const hookName of REMOVED_PROGRAM_AND_PRESET_HOOKS) {
      expect(queryExports).not.toMatch(new RegExp(`export \\{ ${hookName}`))
      expect(mutationExports).not.toMatch(new RegExp(`export \\{ ${hookName}`))
      expect(mainIndex).not.toMatch(new RegExp(`export \\{ ${hookName}`))
    }
  })

  it('does not reference removed program or preset hooks in console program surfaces', () => {
    const appSource = readConsoleFile('app/(app)/programs/page.tsx')
    const dashboardSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/program-selector.tsx',
    )

    for (const source of [appSource, dashboardSource]) {
      for (const hookName of REMOVED_PROGRAM_AND_PRESET_HOOKS) {
        expect(source).not.toMatch(new RegExp(hookName))
      }
    }
  })

  it('does not define preset or patient-program form types in console models', () => {
    const definitionsSource = readConsoleFile('lib/definitions.ts')
    const modelsSource = readConsoleFile('types/models.ts')

    expect(definitionsSource).not.toMatch(/PresetFormSchema/)
    expect(modelsSource).not.toMatch(/CompletePatientProgram/)
    expect(modelsSource).not.toMatch(/PresetWithExercises/)
  })
})
