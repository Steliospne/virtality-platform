import {
  SessionCompletionSaveChoice,
  buildCompletionSessionExerciseRows,
  buildSaveAsNewProgramName,
  canOfferUpdateSourceProgram,
  ReusableProgramKind,
  type ReusableProgramRecord,
  type SessionWorkingCopyExercise,
} from '@virtality/shared/utils'

export type SessionCompletionDialogState = {
  saveChoice: SessionCompletionSaveChoice
  newProgramName: string
  showUpdateConfirmation: boolean
}

export function buildInitialSessionCompletionDialogState(
  sourceProgramName: string | null | undefined,
): SessionCompletionDialogState {
  return {
    saveChoice: SessionCompletionSaveChoice.FINISH_ONLY,
    newProgramName: buildSaveAsNewProgramName(sourceProgramName),
    showUpdateConfirmation: false,
  }
}

export function canShowUpdateSourceProgramOption(
  session: {
    sourceReusableProgramId: string | null
    sourceProgramName: string | null
  },
  sourceProgram: ReusableProgramRecord | null | undefined,
  clinicianUserId?: string,
): boolean {
  if (!clinicianUserId) {
    if (!session.sourceReusableProgramId || !sourceProgram) {
      return false
    }

    return (
      sourceProgram.id === session.sourceReusableProgramId &&
      sourceProgram.kind === ReusableProgramKind.CLINICIAN_OWNED &&
      sourceProgram.retiredAt === null
    )
  }

  return canOfferUpdateSourceProgram(session, sourceProgram, clinicianUserId)
}

export function buildSessionCompletionPayload(input: {
  sessionId: string
  saveChoice: SessionCompletionSaveChoice
  newProgramName: string
  notes?: string | null
  workingCopy: readonly SessionWorkingCopyExercise[]
  persistedRows: ReadonlyArray<{ id: string; exerciseId: string }>
  createId: () => string
}) {
  return {
    id: input.sessionId,
    saveChoice: input.saveChoice,
    newProgramName:
      input.saveChoice === SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM
        ? input.newProgramName.trim()
        : undefined,
    notes: input.notes,
    exercises: buildCompletionSessionExerciseRows(
      input.workingCopy,
      input.persistedRows,
      input.createId,
    ),
  }
}
