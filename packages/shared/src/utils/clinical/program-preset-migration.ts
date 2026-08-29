import { ReusableProgramKind } from './reusable-program.ts'

export const DEFAULT_REUSABLE_PROGRAM_EXERCISE_SETTINGS = {
  sets: 3,
  reps: 10,
  restTime: 5,
  holdTime: 1,
  speed: 1,
} as const

export type ProgramExerciseMigrationInput = {
  id: string
  exerciseId: string
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type PatientProgramMigrationInput = {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  programExercise: ProgramExerciseMigrationInput[]
}

export type PresetExerciseMigrationInput = ProgramExerciseMigrationInput & {
  optional: boolean
}

export type PresetMigrationInput = {
  id: string
  userId: string | null
  presetName: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  presetExercise: PresetExerciseMigrationInput[]
}

export type PatientSessionMigrationInput = {
  id: string
  programId: string | null
  sourceReusableProgramId: string | null
  sourceProgramName: string | null
}

export type ReusableProgramMigrationTarget = {
  id: string
  name: string
  kind: (typeof ReusableProgramKind)[keyof typeof ReusableProgramKind]
  userId: string | null
  createdAt: Date
  updatedAt: Date
  retiredAt: Date | null
}

export type ReusableProgramExerciseMigrationTarget = {
  id: string
  reusableProgramId: string
  exerciseId: string
  position: number
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type PatientSessionSourceUpdate = {
  id: string
  sourceReusableProgramId: string
  sourceProgramName: string
}

export type MigrationSkippedRow = {
  id: string
  sourceType: 'patient-program' | 'user-preset' | 'system-preset'
  reason: string
}

export type MigrationMissingExercise = {
  sourceType: 'patient-program' | 'user-preset' | 'system-preset'
  sourceId: string
  exerciseId: string
}

export type MigrationOrphanedSessionReference = {
  sessionId: string
  programId: string
}

export type MigrationDuplicatePosition = {
  reusableProgramId: string
  position: number
  exerciseRowIds: string[]
}

export type ProgramPresetMigrationLog = {
  patientProgramsMigrated: number
  patientProgramsSkipped: number
  userPresetsMigrated: number
  userPresetsSkipped: number
  systemPresetsMigrated: number
  systemPresetsSkipped: number
  sessionsUpdated: number
  sessionsSkipped: number
  orphanedSessionReferences: MigrationOrphanedSessionReference[]
  missingExercises: MigrationMissingExercise[]
  skippedRows: MigrationSkippedRow[]
  duplicatePositions: MigrationDuplicatePosition[]
}

export type ProgramPresetMigrationPlan = {
  reusablePrograms: ReusableProgramMigrationTarget[]
  reusableProgramExercises: ReusableProgramExerciseMigrationTarget[]
  sessionUpdates: PatientSessionSourceUpdate[]
  log: ProgramPresetMigrationLog
}

export type ProgramPresetMigrationInput = {
  patientPrograms: PatientProgramMigrationInput[]
  presets: PresetMigrationInput[]
  patientSessions: PatientSessionMigrationInput[]
  knownExerciseIds: ReadonlySet<string>
  existingReusableProgramIds: ReadonlySet<string>
}

type ExerciseSettings = {
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

function createEmptyLog(): ProgramPresetMigrationLog {
  return {
    patientProgramsMigrated: 0,
    patientProgramsSkipped: 0,
    userPresetsMigrated: 0,
    userPresetsSkipped: 0,
    systemPresetsMigrated: 0,
    systemPresetsSkipped: 0,
    sessionsUpdated: 0,
    sessionsSkipped: 0,
    orphanedSessionReferences: [],
    missingExercises: [],
    skippedRows: [],
    duplicatePositions: [],
  }
}

export function findDuplicatePositionsInMigrationPlan(
  exercises: readonly ReusableProgramExerciseMigrationTarget[],
): MigrationDuplicatePosition[] {
  const positionsByProgram = new Map<string, Map<number, string[]>>()

  for (const exercise of exercises) {
    const positions =
      positionsByProgram.get(exercise.reusableProgramId) ?? new Map()
    const rowIds = positions.get(exercise.position) ?? []
    rowIds.push(exercise.id)
    positions.set(exercise.position, rowIds)
    positionsByProgram.set(exercise.reusableProgramId, positions)
  }

  const duplicates: MigrationDuplicatePosition[] = []

  for (const [reusableProgramId, positions] of positionsByProgram) {
    for (const [position, exerciseRowIds] of positions) {
      if (exerciseRowIds.length > 1) {
        duplicates.push({
          reusableProgramId,
          position,
          exerciseRowIds,
        })
      }
    }
  }

  return duplicates.sort((left, right) => {
    const programCompare = left.reusableProgramId.localeCompare(
      right.reusableProgramId,
    )
    if (programCompare !== 0) return programCompare
    return left.position - right.position
  })
}

function sortExercisesById<T extends { id: string }>(exercises: T[]): T[] {
  return [...exercises].sort((left, right) => left.id.localeCompare(right.id))
}

export function mapExercisesWithPositions<
  T extends ProgramExerciseMigrationInput,
>(
  exercises: T[],
  options: {
    sourceType: MigrationMissingExercise['sourceType']
    sourceId: string
    knownExerciseIds: ReadonlySet<string>
    missingExercises: MigrationMissingExercise[]
    useDefaultSettings: boolean
  },
): Array<T & ExerciseSettings & { position: number }> {
  const mapped: Array<T & ExerciseSettings & { position: number }> = []
  let position = 0

  for (const exercise of sortExercisesById(exercises)) {
    if (!options.knownExerciseIds.has(exercise.exerciseId)) {
      options.missingExercises.push({
        sourceType: options.sourceType,
        sourceId: options.sourceId,
        exerciseId: exercise.exerciseId,
      })
      continue
    }

    const settings = options.useDefaultSettings
      ? DEFAULT_REUSABLE_PROGRAM_EXERCISE_SETTINGS
      : {
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
          holdTime: exercise.holdTime,
          speed: exercise.speed,
        }

    mapped.push({
      ...exercise,
      ...settings,
      position,
    })
    position += 1
  }

  return mapped
}

function reserveProgramId(
  id: string,
  sourceType: MigrationSkippedRow['sourceType'],
  reservedIds: Set<string>,
  existingReusableProgramIds: ReadonlySet<string>,
  skippedRows: MigrationSkippedRow[],
): boolean {
  if (existingReusableProgramIds.has(id) || reservedIds.has(id)) {
    skippedRows.push({
      id,
      sourceType,
      reason: 'Reusable program ID already exists',
    })
    return false
  }

  reservedIds.add(id)
  return true
}

export function buildProgramPresetMigrationPlan(
  input: ProgramPresetMigrationInput,
): ProgramPresetMigrationPlan {
  const log = createEmptyLog()
  const reusablePrograms: ReusableProgramMigrationTarget[] = []
  const reusableProgramExercises: ReusableProgramExerciseMigrationTarget[] = []
  const programNamesById = new Map<string, string>()
  const reservedProgramIds = new Set<string>()

  for (const program of input.patientPrograms) {
    if (
      !reserveProgramId(
        program.id,
        'patient-program',
        reservedProgramIds,
        input.existingReusableProgramIds,
        log.skippedRows,
      )
    ) {
      log.patientProgramsSkipped += 1
      continue
    }

    reusablePrograms.push({
      id: program.id,
      name: program.name,
      kind: ReusableProgramKind.CLINICIAN_OWNED,
      userId: program.userId,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      retiredAt: program.deletedAt,
    })
    programNamesById.set(program.id, program.name)
    log.patientProgramsMigrated += 1

    const exercises = mapExercisesWithPositions(program.programExercise, {
      sourceType: 'patient-program',
      sourceId: program.id,
      knownExerciseIds: input.knownExerciseIds,
      missingExercises: log.missingExercises,
      useDefaultSettings: false,
    })

    for (const exercise of exercises) {
      reusableProgramExercises.push({
        id: exercise.id,
        reusableProgramId: program.id,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        holdTime: exercise.holdTime,
        speed: exercise.speed,
      })
    }
  }

  for (const preset of input.presets) {
    const isSystemPreset = preset.userId == null
    const sourceType = isSystemPreset ? 'system-preset' : 'user-preset'

    if (
      !reserveProgramId(
        preset.id,
        sourceType,
        reservedProgramIds,
        input.existingReusableProgramIds,
        log.skippedRows,
      )
    ) {
      if (isSystemPreset) {
        log.systemPresetsSkipped += 1
      } else {
        log.userPresetsSkipped += 1
      }
      continue
    }

    reusablePrograms.push({
      id: preset.id,
      name: preset.presetName,
      kind: isSystemPreset
        ? ReusableProgramKind.STARTER_TEMPLATE
        : ReusableProgramKind.CLINICIAN_OWNED,
      userId: preset.userId,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
      retiredAt: preset.deletedAt,
    })
    programNamesById.set(preset.id, preset.presetName)

    if (isSystemPreset) {
      log.systemPresetsMigrated += 1
    } else {
      log.userPresetsMigrated += 1
    }

    const exercises = mapExercisesWithPositions(preset.presetExercise, {
      sourceType,
      sourceId: preset.id,
      knownExerciseIds: input.knownExerciseIds,
      missingExercises: log.missingExercises,
      useDefaultSettings: isSystemPreset,
    })

    for (const exercise of exercises) {
      reusableProgramExercises.push({
        id: exercise.id,
        reusableProgramId: preset.id,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        holdTime: exercise.holdTime,
        speed: exercise.speed,
      })
    }
  }

  const sessionUpdates: PatientSessionSourceUpdate[] = []

  for (const session of input.patientSessions) {
    if (session.sourceReusableProgramId && session.sourceProgramName) {
      log.sessionsSkipped += 1
      continue
    }

    const sourceProgramId =
      session.sourceReusableProgramId ?? session.programId ?? null

    if (!sourceProgramId) {
      log.sessionsSkipped += 1
      continue
    }

    const sourceProgramName = programNamesById.get(sourceProgramId)
    if (!sourceProgramName) {
      log.orphanedSessionReferences.push({
        sessionId: session.id,
        programId: sourceProgramId,
      })
      log.sessionsSkipped += 1
      continue
    }

    sessionUpdates.push({
      id: session.id,
      sourceReusableProgramId: sourceProgramId,
      sourceProgramName,
    })
    log.sessionsUpdated += 1
  }

  log.duplicatePositions = findDuplicatePositionsInMigrationPlan(
    reusableProgramExercises,
  )

  return {
    reusablePrograms,
    reusableProgramExercises,
    sessionUpdates,
    log,
  }
}

export function formatProgramPresetMigrationLog(
  log: ProgramPresetMigrationLog,
  dryRun: boolean,
): string {
  const lines = [
    `=== Program & Preset Migration${dryRun ? ' (DRY RUN)' : ''} ===`,
    `Patient programs migrated: ${log.patientProgramsMigrated}`,
    `Patient programs skipped: ${log.patientProgramsSkipped}`,
    `User presets migrated: ${log.userPresetsMigrated}`,
    `User presets skipped: ${log.userPresetsSkipped}`,
    `System presets migrated: ${log.systemPresetsMigrated}`,
    `System presets skipped: ${log.systemPresetsSkipped}`,
    `Sessions updated: ${log.sessionsUpdated}`,
    `Sessions skipped: ${log.sessionsSkipped}`,
  ]

  if (log.skippedRows.length > 0) {
    lines.push('', 'Skipped rows:')
    for (const row of log.skippedRows) {
      lines.push(`  - ${row.sourceType}/${row.id}: ${row.reason}`)
    }
  }

  if (log.missingExercises.length > 0) {
    lines.push('', 'Missing exercises:')
    for (const row of log.missingExercises) {
      lines.push(
        `  - ${row.sourceType}/${row.sourceId}: exercise ${row.exerciseId}`,
      )
    }
  }

  if (log.orphanedSessionReferences.length > 0) {
    lines.push('', 'Orphaned session references:')
    for (const row of log.orphanedSessionReferences) {
      lines.push(`  - session ${row.sessionId}: program ${row.programId}`)
    }
  }

  if (log.duplicatePositions.length > 0) {
    lines.push('', 'Duplicate positions:')
    for (const row of log.duplicatePositions) {
      lines.push(
        `  - program ${row.reusableProgramId}: position ${row.position} (${row.exerciseRowIds.join(', ')})`,
      )
    }
  }

  return lines.join('\n')
}
