import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REUSABLE_PROGRAM_EXERCISE_SETTINGS,
  buildProgramPresetMigrationPlan,
  findDuplicatePositionsInMigrationPlan,
  formatProgramPresetMigrationLog,
  mapExercisesWithPositions,
} from './program-preset-migration.js'
import { ReusableProgramKind } from './reusable-program.js'

const createdAt = new Date('2026-01-01T00:00:00.000Z')
const updatedAt = new Date('2026-02-01T00:00:00.000Z')
const knownExerciseIds = new Set(['exercise-a', 'exercise-b', 'exercise-c'])

describe('program and preset migration plan', () => {
  it('migrates patient programs one-to-one with preserved IDs and clinician ownership', () => {
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [
        {
          id: 'program-1',
          name: 'Shoulder rehab',
          userId: 'clinician-1',
          createdAt,
          updatedAt,
          deletedAt: null,
          programExercise: [
            {
              id: 'row-b',
              exerciseId: 'exercise-b',
              sets: 4,
              reps: 8,
              restTime: 10,
              holdTime: 2,
              speed: 1.5,
            },
            {
              id: 'row-a',
              exerciseId: 'exercise-a',
              sets: 3,
              reps: 10,
              restTime: 5,
              holdTime: 1,
              speed: 1,
            },
          ],
        },
      ],
      presets: [],
      patientSessions: [],
      knownExerciseIds,
      existingReusableProgramIds: new Set(),
    })

    expect(plan.reusablePrograms).toEqual([
      {
        id: 'program-1',
        name: 'Shoulder rehab',
        kind: ReusableProgramKind.CLINICIAN_OWNED,
        userId: 'clinician-1',
        createdAt,
        updatedAt,
        retiredAt: null,
      },
    ])
    expect(plan.reusableProgramExercises).toEqual([
      {
        id: 'row-a',
        reusableProgramId: 'program-1',
        exerciseId: 'exercise-a',
        position: 0,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
      {
        id: 'row-b',
        reusableProgramId: 'program-1',
        exerciseId: 'exercise-b',
        position: 1,
        sets: 4,
        reps: 8,
        restTime: 10,
        holdTime: 2,
        speed: 1.5,
      },
    ])
    expect(plan.log.patientProgramsMigrated).toBe(1)
  })

  it('migrates user presets with preserved settings and retires deleted presets', () => {
    const deletedAt = new Date('2026-03-01T00:00:00.000Z')
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [],
      presets: [
        {
          id: 'preset-1',
          userId: 'clinician-1',
          presetName: 'My preset',
          createdAt,
          updatedAt,
          deletedAt,
          presetExercise: [
            {
              id: 'preset-row-1',
              exerciseId: 'exercise-a',
              optional: false,
              sets: 5,
              reps: 12,
              restTime: 8,
              holdTime: 3,
              speed: 0.8,
            },
          ],
        },
      ],
      patientSessions: [],
      knownExerciseIds,
      existingReusableProgramIds: new Set(),
    })

    expect(plan.reusablePrograms[0]).toMatchObject({
      id: 'preset-1',
      name: 'My preset',
      kind: ReusableProgramKind.CLINICIAN_OWNED,
      userId: 'clinician-1',
      retiredAt: deletedAt,
    })
    expect(plan.reusableProgramExercises[0]).toMatchObject({
      sets: 5,
      reps: 12,
      restTime: 8,
      holdTime: 3,
      speed: 0.8,
    })
    expect(plan.log.userPresetsMigrated).toBe(1)
  })

  it('migrates system presets into starter templates with default settings only', () => {
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [],
      presets: [
        {
          id: 'system-preset-1',
          userId: null,
          presetName: 'Starter shoulder',
          createdAt,
          updatedAt,
          deletedAt: null,
          presetExercise: [
            {
              id: 'system-row-1',
              exerciseId: 'exercise-c',
              optional: true,
              sets: 9,
              reps: 9,
              restTime: 9,
              holdTime: 9,
              speed: 9,
            },
          ],
        },
      ],
      patientSessions: [],
      knownExerciseIds,
      existingReusableProgramIds: new Set(),
    })

    expect(plan.reusablePrograms[0]).toMatchObject({
      id: 'system-preset-1',
      kind: ReusableProgramKind.STARTER_TEMPLATE,
      userId: null,
    })
    expect(plan.reusableProgramExercises[0]).toEqual({
      id: 'system-row-1',
      reusableProgramId: 'system-preset-1',
      exerciseId: 'exercise-c',
      position: 0,
      ...DEFAULT_REUSABLE_PROGRAM_EXERCISE_SETTINGS,
    })
    expect(plan.log.systemPresetsMigrated).toBe(1)
  })

  it('updates session source references from legacy program IDs', () => {
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [
        {
          id: 'program-1',
          name: 'Shoulder rehab',
          userId: 'clinician-1',
          createdAt,
          updatedAt,
          deletedAt: null,
          programExercise: [],
        },
      ],
      presets: [],
      patientSessions: [
        {
          id: 'session-1',
          programId: 'program-1',
          sourceReusableProgramId: null,
          sourceProgramName: null,
        },
        {
          id: 'session-2',
          programId: 'missing-program',
          sourceReusableProgramId: null,
          sourceProgramName: null,
        },
      ],
      knownExerciseIds,
      existingReusableProgramIds: new Set(),
    })

    expect(plan.sessionUpdates).toEqual([
      {
        id: 'session-1',
        sourceReusableProgramId: 'program-1',
        sourceProgramName: 'Shoulder rehab',
      },
    ])
    expect(plan.log.orphanedSessionReferences).toEqual([
      {
        sessionId: 'session-2',
        programId: 'missing-program',
      },
    ])
  })

  it('skips rows that already exist and logs missing exercises', () => {
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [
        {
          id: 'program-1',
          name: 'Shoulder rehab',
          userId: 'clinician-1',
          createdAt,
          updatedAt,
          deletedAt: null,
          programExercise: [
            {
              id: 'row-1',
              exerciseId: 'missing-exercise',
              sets: 3,
              reps: 10,
              restTime: 5,
              holdTime: 1,
              speed: 1,
            },
          ],
        },
      ],
      presets: [
        {
          id: 'program-1',
          userId: 'clinician-1',
          presetName: 'Conflicting preset',
          createdAt,
          updatedAt,
          deletedAt: null,
          presetExercise: [],
        },
      ],
      patientSessions: [],
      knownExerciseIds,
      existingReusableProgramIds: new Set(['existing-program']),
    })

    expect(plan.reusablePrograms).toHaveLength(1)
    expect(plan.reusableProgramExercises).toHaveLength(0)
    expect(plan.log.missingExercises).toEqual([
      {
        sourceType: 'patient-program',
        sourceId: 'program-1',
        exerciseId: 'missing-exercise',
      },
    ])
    expect(plan.log.skippedRows).toEqual([
      {
        id: 'program-1',
        sourceType: 'user-preset',
        reason: 'Reusable program ID already exists',
      },
    ])
  })

  it('assigns unique positions even when source exercises are out of order', () => {
    const mapped = mapExercisesWithPositions(
      [
        {
          id: 'row-z',
          exerciseId: 'exercise-b',
          sets: 1,
          reps: 1,
          restTime: 1,
          holdTime: 1,
          speed: 1,
        },
        {
          id: 'row-a',
          exerciseId: 'exercise-a',
          sets: 1,
          reps: 1,
          restTime: 1,
          holdTime: 1,
          speed: 1,
        },
      ],
      {
        sourceType: 'patient-program',
        sourceId: 'program-1',
        knownExerciseIds,
        missingExercises: [],
        useDefaultSettings: false,
      },
    )

    expect(mapped.map((row) => row.position)).toEqual([0, 1])
    expect(mapped[0]?.id).toBe('row-a')
    expect(mapped[1]?.id).toBe('row-z')
  })

  it('formats dry-run output with counts and diagnostics', () => {
    const output = formatProgramPresetMigrationLog(
      {
        patientProgramsMigrated: 2,
        patientProgramsSkipped: 1,
        userPresetsMigrated: 1,
        userPresetsSkipped: 0,
        systemPresetsMigrated: 3,
        systemPresetsSkipped: 0,
        sessionsUpdated: 4,
        sessionsSkipped: 1,
        orphanedSessionReferences: [
          { sessionId: 'session-1', programId: 'missing' },
        ],
        missingExercises: [
          {
            sourceType: 'patient-program',
            sourceId: 'program-1',
            exerciseId: 'missing',
          },
        ],
        skippedRows: [
          {
            id: 'program-2',
            sourceType: 'patient-program',
            reason: 'Reusable program ID already exists',
          },
        ],
        duplicatePositions: [
          {
            reusableProgramId: 'program-1',
            position: 0,
            exerciseRowIds: ['row-a', 'row-b'],
          },
        ],
      },
      true,
    )

    expect(output).toContain('DRY RUN')
    expect(output).toContain('Patient programs migrated: 2')
    expect(output).toContain('Missing exercises:')
    expect(output).toContain('Orphaned session references:')
    expect(output).toContain('Duplicate positions:')
  })

  it('reports duplicate positions in the migration plan log', () => {
    const duplicates = findDuplicatePositionsInMigrationPlan([
      {
        id: 'row-a',
        reusableProgramId: 'program-1',
        exerciseId: 'exercise-a',
        position: 0,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
      {
        id: 'row-b',
        reusableProgramId: 'program-1',
        exerciseId: 'exercise-b',
        position: 0,
        sets: 2,
        reps: 8,
        restTime: 4,
        holdTime: 2,
        speed: 1.5,
      },
      {
        id: 'row-c',
        reusableProgramId: 'program-2',
        exerciseId: 'exercise-c',
        position: 1,
        sets: 1,
        reps: 1,
        restTime: 1,
        holdTime: 1,
        speed: 1,
      },
    ])

    expect(duplicates).toEqual([
      {
        reusableProgramId: 'program-1',
        position: 0,
        exerciseRowIds: ['row-a', 'row-b'],
      },
    ])
  })

  it('leaves duplicate positions empty for valid migration plans', () => {
    const plan = buildProgramPresetMigrationPlan({
      patientPrograms: [
        {
          id: 'program-1',
          name: 'Shoulder rehab',
          userId: 'clinician-1',
          createdAt,
          updatedAt,
          deletedAt: null,
          programExercise: [
            {
              id: 'row-a',
              exerciseId: 'exercise-a',
              sets: 3,
              reps: 10,
              restTime: 5,
              holdTime: 1,
              speed: 1,
            },
            {
              id: 'row-b',
              exerciseId: 'exercise-b',
              sets: 2,
              reps: 8,
              restTime: 4,
              holdTime: 2,
              speed: 1.5,
            },
          ],
        },
      ],
      presets: [],
      patientSessions: [],
      knownExerciseIds,
      existingReusableProgramIds: new Set(),
    })

    expect(plan.log.duplicatePositions).toEqual([])
  })
})
