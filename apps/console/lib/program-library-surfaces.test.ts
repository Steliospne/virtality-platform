import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('program library surfaces', () => {
  it('lists reusable programs with exercise count and last updated metadata', () => {
    const tableSource = readConsoleFile(
      'app/(app)/programs/_components/program-library-table.tsx',
    )
    const columnsSource = readConsoleFile(
      'app/(app)/programs/_components/columns.tsx',
    )

    expect(tableSource).toMatch(/Program Library/)
    expect(tableSource).toMatch(/useReusablePrograms/)
    expect(tableSource).toMatch(/filterProgramsBySearch/)
    expect(columnsSource).toMatch(/getProgramExerciseCount/)
    expect(columnsSource).toMatch(/updatedAt/)
    expect(columnsSource).not.toMatch(/sets|reps|restTime|holdTime|speed/)
  })

  it('offers equally visible scratch and starter template creation paths', () => {
    const createFlowSource = readConsoleFile(
      'app/(app)/programs/new/_components/reusable-program-create-flow.tsx',
    )

    expect(createFlowSource).toMatch(/Create your own program/)
    expect(createFlowSource).toMatch(/Use a starter template/)
    expect(createFlowSource).toMatch(/md:grid-cols-2/)
    expect(createFlowSource).toMatch(/ReusableProgramFormView/)
    expect(createFlowSource).toMatch(/StarterTemplatePicker/)
  })

  it('previews starter template exercises without dose or settings', () => {
    const pickerSource = readConsoleFile(
      'app/(app)/programs/new/_components/starter-template-picker.tsx',
    )
    const previewItemSource = readConsoleFile(
      'app/(app)/programs/new/_components/starter-template-exercise-preview-item.tsx',
    )

    expect(pickerSource).toMatch(/starterTemplateExercisesForPreview/)
    expect(pickerSource).toMatch(/included exercises only/i)
    expect(previewItemSource).toMatch(/StarterTemplatePreviewExercise/)
    expect(previewItemSource).not.toMatch(/sets|reps|restTime|holdTime|speed/)
  })

  it('seeds starter template exercises into catalog selection after template pick', () => {
    const createFormSource = readConsoleFile(
      'app/(app)/programs/new/_components/reusable-program-form.tsx',
    )

    expect(createFormSource).toMatch(/starterTemplateCatalogSelection/)
    expect(createFormSource).toMatch(/suggestedProgramNameFromTemplate/)
  })

  it('requires a name and at least one enabled exercise before saving', () => {
    const createFormSource = readConsoleFile(
      'app/(app)/programs/new/_components/reusable-program-form.tsx',
    )
    const editFormSource = readConsoleFile(
      'app/(app)/programs/[programId]/edit/_components/reusable-program-edit-form.tsx',
    )

    for (const source of [createFormSource, editFormSource]) {
      expect(source).toMatch(/ReusableProgramFormSchema/)
      expect(source).toMatch(/canSubmitReusableProgram/)
      expect(source).toMatch(/ZERO_ENABLED_VARIANTS_MESSAGE/)
    }
  })

  it('supports make a copy, edit, and delete actions from the library table', () => {
    const columnsSource = readConsoleFile(
      'app/(app)/programs/_components/columns.tsx',
    )

    expect(columnsSource).toMatch(/Make a copy/)
    expect(columnsSource).toMatch(/useCopyReusableProgram/)
    expect(columnsSource).toMatch(/useRetireReusableProgram/)
    expect(columnsSource).toMatch(/PROGRAM_RETIRE_CONFIRMATION/)
    expect(columnsSource).toMatch(/<Archive \/>\s*\n\s*Delete/)
    expect(columnsSource).toMatch(/Delete program/)
    expect(columnsSource).toMatch(/\/programs\/\$\{program\.id\}\/edit/)
  })

  it('blocks direct editing of starter templates through clinician flows', () => {
    const editFormSource = readConsoleFile(
      'app/(app)/programs/[programId]/edit/_components/reusable-program-edit-form.tsx',
    )

    expect(editFormSource).toMatch(/isStarterTemplateProgram/)
    expect(editFormSource).toMatch(/Starter templates cannot be edited/)
    expect(editFormSource).toMatch(/router\.replace\('\/programs'\)/)
  })

  it('seeds catalog selection from existing program exercises without persisting on open', () => {
    const editFormSource = readConsoleFile(
      'app/(app)/programs/[programId]/edit/_components/reusable-program-edit-form.tsx',
    )

    expect(editFormSource).toMatch(/reusableProgramExercisesForCatalogSeed/)
    expect(editFormSource).toMatch(/reusableProgramMetadataForEdit/)
    expect(editFormSource).toMatch(
      /updateExercises\(withRom\(seededExercises\)\)/,
    )
    expect(editFormSource).toMatch(/useUpdateReusableProgram\(\{\}\)/)
    expect(editFormSource).toMatch(/form\.handleSubmit\(onSubmit\)/)
    expect(editFormSource.indexOf('updateProgram(')).toBeGreaterThan(
      editFormSource.indexOf('const onSubmit'),
    )
    expect(editFormSource.indexOf('updateProgramExercises(')).toBeGreaterThan(
      editFormSource.indexOf('const onSubmit'),
    )
  })
})
