import { describe, expect, it } from 'vitest'
import {
  ReusableProgramKind,
  assertClinicianCanMutateProgram,
  buildClinicianOwnedProgramListWhere,
  buildCopiedProgramExercises,
  buildCopiedProgramName,
  buildRetireProgramData,
  buildStarterTemplateListWhere,
  isProgramAvailableForTreatment,
  validateUniqueExercisePositions,
} from './reusable-program.js'

describe('reusable program query filters', () => {
  it('scopes clinician-owned list queries to the current clinician and active programs', () => {
    expect(buildClinicianOwnedProgramListWhere('clinician-1')).toEqual({
      userId: 'clinician-1',
      kind: ReusableProgramKind.CLINICIAN_OWNED,
      retiredAt: null,
    })
  })

  it('lists starter templates without clinician ownership', () => {
    expect(buildStarterTemplateListWhere()).toEqual({
      kind: ReusableProgramKind.STARTER_TEMPLATE,
      retiredAt: null,
    })
  })

  it('excludes retired programs from treatment selection', () => {
    expect(
      isProgramAvailableForTreatment({
        id: 'program-1',
        name: 'Shoulder rehab',
        kind: ReusableProgramKind.CLINICIAN_OWNED,
        userId: 'clinician-1',
        retiredAt: new Date('2026-06-01T00:00:00.000Z'),
      }),
    ).toBe(false)

    expect(
      isProgramAvailableForTreatment({
        id: 'program-2',
        name: 'Shoulder rehab',
        kind: ReusableProgramKind.CLINICIAN_OWNED,
        userId: 'clinician-1',
        retiredAt: null,
      }),
    ).toBe(true)

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

describe('reusable program mutation guards', () => {
  const ownedProgram = {
    id: 'program-1',
    name: 'Shoulder rehab',
    kind: ReusableProgramKind.CLINICIAN_OWNED,
    userId: 'clinician-1',
    retiredAt: null,
  }

  it('allows mutation for clinician-owned programs owned by the current clinician', () => {
    expect(() =>
      assertClinicianCanMutateProgram(ownedProgram, 'clinician-1'),
    ).not.toThrow()
  })

  it('rejects mutation for starter templates', () => {
    expect(() =>
      assertClinicianCanMutateProgram(
        {
          ...ownedProgram,
          kind: ReusableProgramKind.STARTER_TEMPLATE,
          userId: null,
        },
        'clinician-1',
      ),
    ).toThrow(/starter templates cannot be modified/i)
  })

  it('rejects mutation for programs owned by another clinician', () => {
    expect(() =>
      assertClinicianCanMutateProgram(ownedProgram, 'clinician-2'),
    ).toThrow(/scoped to another clinician/i)
  })

  it('rejects mutation for retired programs', () => {
    expect(() =>
      assertClinicianCanMutateProgram(
        {
          ...ownedProgram,
          retiredAt: new Date('2026-06-01T00:00:00.000Z'),
        },
        'clinician-1',
      ),
    ).toThrow(/retired reusable programs cannot be modified/i)
  })
})

describe('reusable program exercise positions', () => {
  it('allows duplicate exercise IDs within one program', () => {
    const exercises = [
      {
        id: 'row-1',
        exerciseId: 'exercise-a',
        position: 0,
      },
      {
        id: 'row-2',
        exerciseId: 'exercise-a',
        position: 1,
      },
    ]

    expect(() => validateUniqueExercisePositions(exercises)).not.toThrow()
  })

  it('requires unique positions within one reusable program', () => {
    expect(() =>
      validateUniqueExercisePositions([
        { id: 'row-1', position: 0 },
        { id: 'row-2', position: 0 },
      ]),
    ).toThrow(/positions must be unique/i)
  })
})

describe('reusable program retirement', () => {
  it('builds retirement data without deleting historical records', () => {
    const now = new Date('2026-06-13T12:00:00.000Z')

    expect(buildRetireProgramData(now)).toEqual({
      retiredAt: now,
      updatedAt: now,
    })
  })
})

describe('reusable program copy', () => {
  it('suggests a friendly copy name from the source program', () => {
    expect(buildCopiedProgramName('Shoulder rehab')).toBe(
      'Shoulder rehab (copy)',
    )
    expect(buildCopiedProgramName('  ')).toBe('Untitled program (copy)')
  })

  it('preserves exercise settings and position with new row identities', () => {
    const copied = buildCopiedProgramExercises(
      [
        {
          id: 'row-2',
          exerciseId: 'exercise-b',
          position: 1,
          sets: 4,
          reps: 8,
          restTime: 10,
          holdTime: 2,
          speed: 1.5,
        },
        {
          id: 'row-1',
          exerciseId: 'exercise-a',
          position: 0,
          sets: 3,
          reps: 10,
          restTime: 5,
          holdTime: 1,
          speed: 1,
        },
      ],
      'program-copy',
      () => 'generated-id',
    )

    expect(copied).toEqual([
      {
        id: 'generated-id',
        reusableProgramId: 'program-copy',
        exerciseId: 'exercise-a',
        position: 0,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
      {
        id: 'generated-id',
        reusableProgramId: 'program-copy',
        exerciseId: 'exercise-b',
        position: 1,
        sets: 4,
        reps: 8,
        restTime: 10,
        holdTime: 2,
        speed: 1.5,
      },
    ])
  })
})
