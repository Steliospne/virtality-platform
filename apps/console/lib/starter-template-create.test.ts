import { describe, expect, it, vi } from 'vitest'
import type { Exercise } from '@virtality/db'
import {
  isProgramAvailableForTreatment,
  ReusableProgramKind,
} from '@virtality/shared/utils'
import {
  STANDARD_PROGRAM_EXERCISE_SETTINGS,
  starterTemplateExerciseNamesForPreview,
  starterTemplateExercisesForEditor,
  starterTemplateExercisesForPreview,
  suggestedProgramNameFromTemplate,
} from './starter-template-create.js'

const catalog = [
  {
    id: 'ex-1',
    displayName: 'Wrist extension',
    direction: 'Left',
    enabled: true,
  },
  {
    id: 'ex-2',
    displayName: 'Wrist extension',
    direction: 'Right',
    enabled: true,
  },
  {
    id: 'ex-3',
    displayName: 'Grip squeeze',
    direction: 'Left',
    enabled: false,
  },
] as Exercise[]

describe('starter template creation helpers', () => {
  it('previews enabled exercises in template order without dose or settings', () => {
    const previewExercises = starterTemplateExercisesForPreview(
      [
        {
          exerciseId: 'ex-2',
          position: 1,
          sets: 99,
          reps: 99,
          restTime: 99,
          holdTime: 99,
          speed: 9,
        },
        {
          exerciseId: 'ex-1',
          position: 0,
          sets: 1,
          reps: 1,
          restTime: 1,
          holdTime: 1,
          speed: 1,
        },
        {
          exerciseId: 'ex-3',
          position: 2,
          sets: 2,
          reps: 2,
          restTime: 2,
          holdTime: 2,
          speed: 2,
        },
      ],
      catalog,
    )

    expect(previewExercises.map((exercise) => exercise.id)).toEqual([
      'ex-1',
      'ex-2',
    ])

    const names = starterTemplateExerciseNamesForPreview(
      [
        {
          exerciseId: 'ex-2',
          position: 1,
          sets: 99,
          reps: 99,
          restTime: 99,
          holdTime: 99,
          speed: 9,
        },
        {
          exerciseId: 'ex-1',
          position: 0,
          sets: 1,
          reps: 1,
          restTime: 1,
          holdTime: 1,
          speed: 1,
        },
        {
          exerciseId: 'ex-3',
          position: 2,
          sets: 2,
          reps: 2,
          restTime: 2,
          holdTime: 2,
          speed: 2,
        },
      ],
      catalog,
    )

    expect(names).toEqual(['Wrist extension', 'Wrist extension'])
  })

  it('maps template exercises to standard default settings for the editor', () => {
    const generateId = vi
      .fn()
      .mockReturnValueOnce('row-1')
      .mockReturnValueOnce('row-2')

    const rows = starterTemplateExercisesForEditor(
      [
        {
          exerciseId: 'ex-1',
          position: 0,
          sets: 12,
          reps: 20,
          restTime: 30,
          holdTime: 4,
          speed: 2.5,
        },
        {
          exerciseId: 'ex-2',
          position: 1,
          sets: 8,
          reps: 15,
          restTime: 20,
          holdTime: 3,
          speed: 1.5,
        },
      ],
      catalog,
      generateId,
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'row-1',
      exerciseId: 'ex-1',
      ...STANDARD_PROGRAM_EXERCISE_SETTINGS,
    })
    expect(rows[1]).toMatchObject({
      id: 'row-2',
      exerciseId: 'ex-2',
      ...STANDARD_PROGRAM_EXERCISE_SETTINGS,
    })
    expect(rows[0]?.sets).not.toBe(12)
    expect(rows[1]?.reps).not.toBe(15)
  })

  it('suggests the template name for the clinician-owned program editor', () => {
    expect(suggestedProgramNameFromTemplate('  Upper limb basics  ')).toBe(
      'Upper limb basics',
    )
  })

  it('keeps starter templates unavailable for treatment-time selection', () => {
    expect(
      isProgramAvailableForTreatment({
        id: 'template-1',
        name: 'Starter',
        kind: ReusableProgramKind.STARTER_TEMPLATE,
        userId: null,
        retiredAt: null,
      }),
    ).toBe(false)
  })
})
