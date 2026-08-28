import type { CompleteExercise, ProgressDataPoint } from '@/types/models'
import {
  applyCompletedRepToPlotData,
  normalizeRepEndPayload,
  normalizeSetEndPayload,
} from './progress-event-normalization'
import {
  buildSessionExerciseRowsFromWorkingCopy,
  type SessionExerciseRowInput,
} from './patient-dashboard-session-launch'
import {
  buildExerciseSkipCheckpoint,
  buildSetCompletionCheckpoint,
  mutableProgressByExerciseId,
  shouldResetLiveExerciseAfterSetCompletion,
} from './session-progress-checkpoint'
import {
  isDirectExerciseSelectionDisabled,
  resolveDirectExerciseSkipTarget,
  resolveForwardBackSkipTarget,
  shouldIgnoreProgressEventDuringPendingExerciseChange,
  shouldPromotePendingExerciseOnAck,
  type PendingExerciseChange,
} from './session-exercise-skip'
import {
  buildSessionProgressUpserts,
  type SessionProgressUpsertInput,
} from './session-progress-persistence'

export type SkipSafeProgressFlowState = {
  patientSessionId: string
  sessionExerciseRows: ReadonlyArray<SessionExerciseRowInput>
  headsetConfirmedExerciseIndex: number
  pendingExerciseChange: PendingExerciseChange | null
  progressByExerciseId: Record<string, ProgressDataPoint[]>
  currentExerciseProgress: ProgressDataPoint[]
  currSet: number
  currRep: number
}

export type SkipSafeProgressFlowActionResult = {
  state: SkipSafeProgressFlowState
  remoteUpserts: SessionProgressUpsertInput[]
}

export type ExerciseSkipRequest =
  | { kind: 'forward' }
  | { kind: 'back' }
  | { kind: 'direct'; targetExerciseIndex: number }

type PersistOptions = {
  persistSucceeds?: boolean
}

function unchangedResult(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult {
  return { state, remoteUpserts: [] }
}

function progressCheckpointBase(
  state: SkipSafeProgressFlowState,
  currentExerciseIndex = state.headsetConfirmedExerciseIndex,
) {
  return {
    patientSessionId: state.patientSessionId,
    sessionExerciseRows: state.sessionExerciseRows,
    currentExerciseIndex,
    progressByExerciseId: state.progressByExerciseId,
    currentExerciseProgress: state.currentExerciseProgress,
  }
}

function createEmptyPlotData(reps: number): ProgressDataPoint[] {
  return Array.from({ length: reps }, (_, index) => ({ rep: index + 1 }))
}

function getCurrentSessionExercise(
  state: SkipSafeProgressFlowState,
): SessionExerciseRowInput | undefined {
  return state.sessionExerciseRows[state.headsetConfirmedExerciseIndex]
}

function clearCurrentExerciseProgress(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowState {
  const currentExercise = getCurrentSessionExercise(state)

  return {
    ...state,
    currSet: 0,
    currRep: 0,
    currentExerciseProgress: createEmptyPlotData(currentExercise?.reps ?? 0),
  }
}

function shouldIgnoreProgressEvent(state: SkipSafeProgressFlowState): boolean {
  const currentExercise = getCurrentSessionExercise(state)

  if (!currentExercise) {
    return false
  }

  return shouldIgnoreProgressEventDuringPendingExerciseChange({
    pendingExerciseChange: state.pendingExerciseChange,
    eventExerciseIndex: state.headsetConfirmedExerciseIndex,
    eventExerciseId: currentExercise.exerciseId,
  })
}

function recordRemoteUpsert(
  result: SkipSafeProgressFlowActionResult,
  upsert: SessionProgressUpsertInput | null,
  options?: PersistOptions,
): SkipSafeProgressFlowActionResult {
  if (!upsert || options?.persistSucceeds === false) {
    return result
  }

  return {
    ...result,
    remoteUpserts: [...result.remoteUpserts, upsert],
  }
}

export function createSkipSafeProgressFlowState(input: {
  patientSessionId: string
  exercises: ReadonlyArray<CompleteExercise>
  createRowId: () => string
  startingExerciseIndex?: number
}): SkipSafeProgressFlowState {
  const sessionExerciseRows = buildSessionExerciseRowsFromWorkingCopy(
    [...input.exercises],
    input.patientSessionId,
    input.createRowId,
  )
  const startingExerciseIndex = input.startingExerciseIndex ?? 0
  const startingExercise = sessionExerciseRows[startingExerciseIndex]

  return {
    patientSessionId: input.patientSessionId,
    sessionExerciseRows,
    headsetConfirmedExerciseIndex: startingExerciseIndex,
    pendingExerciseChange: null,
    progressByExerciseId: {},
    currentExerciseProgress: createEmptyPlotData(startingExercise?.reps ?? 0),
    currSet: 0,
    currRep: 0,
  }
}

export type ApplyRepEndToFlowResult =
  | (SkipSafeProgressFlowActionResult & {
      applied: false
    })
  | (SkipSafeProgressFlowActionResult & {
      applied: true
      completedRep: number
      progress: number
    })

export type ApplySetEndToFlowResult =
  | (SkipSafeProgressFlowActionResult & {
      applied: false
      advancedToNextExercise: false
    })
  | (SkipSafeProgressFlowActionResult & {
      applied: true
      advancedToNextExercise: boolean
    })

function unchangedRepEndResult(
  state: SkipSafeProgressFlowState,
): ApplyRepEndToFlowResult {
  return { ...unchangedResult(state), applied: false }
}

function unchangedSetEndResult(
  state: SkipSafeProgressFlowState,
): ApplySetEndToFlowResult {
  return {
    ...unchangedResult(state),
    applied: false,
    advancedToNextExercise: false,
  }
}

export function applyRepEndToFlow(
  state: SkipSafeProgressFlowState,
  payload: string,
): ApplyRepEndToFlowResult {
  if (shouldIgnoreProgressEvent(state)) {
    return unchangedRepEndResult(state)
  }

  const normalized = normalizeRepEndPayload(payload)

  if (!normalized.ok) {
    return unchangedRepEndResult(state)
  }

  const { completedRep, progress } = normalized.event
  const activeSet = state.currSet + 1
  const currentExerciseProgress = applyCompletedRepToPlotData(
    state.currentExerciseProgress,
    {
      completedRep,
      activeSet,
      progressPercent: progress * 100,
    },
  )

  return {
    state: {
      ...state,
      currRep: completedRep - 1,
      currentExerciseProgress,
    },
    remoteUpserts: [],
    applied: true,
    completedRep,
    progress,
  }
}

export function applySetEndToFlow(
  state: SkipSafeProgressFlowState,
  payload: string,
  options?: PersistOptions,
): ApplySetEndToFlowResult {
  if (shouldIgnoreProgressEvent(state)) {
    return unchangedSetEndResult(state)
  }

  const normalized = normalizeSetEndPayload(payload)

  if (!normalized.ok) {
    return unchangedSetEndResult(state)
  }

  const { completedSet } = normalized.event
  const currentExerciseIndex = state.headsetConfirmedExerciseIndex
  const checkpoint = buildSetCompletionCheckpoint({
    ...progressCheckpointBase(state, currentExerciseIndex),
    completedSet,
    lastCompletedRepIndex: state.currRep,
    isLastExercise:
      currentExerciseIndex === state.sessionExerciseRows.length - 1,
  })

  const advancedToNextExercise = shouldResetLiveExerciseAfterSetCompletion({
    currentExerciseIndex,
    nextCurrentExerciseIndex: checkpoint.nextCurrentExerciseIndex,
    exerciseCount: state.sessionExerciseRows.length,
  })

  let nextState: SkipSafeProgressFlowState = {
    ...state,
    currSet: completedSet,
    progressByExerciseId: mutableProgressByExerciseId(
      checkpoint.progressByExerciseId,
    ),
    headsetConfirmedExerciseIndex: checkpoint.nextCurrentExerciseIndex,
  }

  if (advancedToNextExercise) {
    nextState = clearCurrentExerciseProgress(nextState)
  }

  return {
    ...recordRemoteUpsert(
      { state: nextState, remoteUpserts: [] },
      checkpoint.upsert,
      options,
    ),
    applied: true,
    advancedToNextExercise,
  }
}

export function requestExerciseSkipInFlow(
  state: SkipSafeProgressFlowState,
  request: ExerciseSkipRequest,
  options?: PersistOptions,
): SkipSafeProgressFlowActionResult & { skipRequested: boolean } {
  if (
    isDirectExerciseSelectionDisabled({
      pendingExerciseChange: state.pendingExerciseChange,
    })
  ) {
    return { ...unchangedResult(state), skipRequested: false }
  }

  const targetIndex = resolveSkipTargetIndex(state, request)

  if (targetIndex === null) {
    return { ...unchangedResult(state), skipRequested: false }
  }

  const sourceIndex = state.headsetConfirmedExerciseIndex
  const sourceExercise = state.sessionExerciseRows[sourceIndex]
  const targetExercise = state.sessionExerciseRows[targetIndex]

  if (!sourceExercise || !targetExercise || targetIndex === sourceIndex) {
    return { ...unchangedResult(state), skipRequested: false }
  }

  const pendingExerciseChange: PendingExerciseChange = {
    targetExerciseIndex: targetIndex,
    sourceExerciseIndex: sourceIndex,
    sourceExerciseId: sourceExercise.exerciseId,
  }

  const checkpoint = buildExerciseSkipCheckpoint(
    progressCheckpointBase(state, sourceIndex),
  )

  const nextState: SkipSafeProgressFlowState = {
    ...state,
    pendingExerciseChange,
    progressByExerciseId: mutableProgressByExerciseId(
      checkpoint.progressByExerciseId,
    ),
  }

  const result = recordRemoteUpsert(
    { state: nextState, remoteUpserts: [] },
    checkpoint.upsert,
    options,
  )

  return { ...result, skipRequested: true }
}

function resolveSkipTargetIndex(
  state: SkipSafeProgressFlowState,
  request: ExerciseSkipRequest,
): number | null {
  const currentExerciseIndex = state.headsetConfirmedExerciseIndex

  switch (request.kind) {
    case 'direct':
      return resolveDirectExerciseSkipTarget({
        currentExerciseIndex,
        targetExerciseIndex: request.targetExerciseIndex,
      })
    case 'forward':
    case 'back':
      return resolveForwardBackSkipTarget({
        currentExerciseIndex,
        exerciseCount: state.sessionExerciseRows.length,
        direction: request.kind,
      })
  }
}

export function acknowledgeExerciseChangeInFlow(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult & { acknowledged: boolean } {
  const pending = state.pendingExerciseChange

  if (
    !pending ||
    !shouldPromotePendingExerciseOnAck({ pendingExerciseChange: pending })
  ) {
    return { ...unchangedResult(state), acknowledged: false }
  }

  const nextState = clearCurrentExerciseProgress({
    ...state,
    headsetConfirmedExerciseIndex: pending.targetExerciseIndex,
    pendingExerciseChange: null,
  })

  return { state: nextState, remoteUpserts: [], acknowledged: true }
}

function resolveCompletedExerciseIndex(
  state: SkipSafeProgressFlowState,
  completedExerciseId: string,
): number | null {
  const index = state.sessionExerciseRows.findIndex(
    (row) =>
      row.exerciseId === completedExerciseId || row.id === completedExerciseId,
  )

  return index >= 0 ? index : null
}

export function applyHeadsetExerciseAdvanceInFlow(
  state: SkipSafeProgressFlowState,
  completedExerciseId: string,
): SkipSafeProgressFlowActionResult & { advanced: boolean } {
  if (state.pendingExerciseChange) {
    return { ...unchangedResult(state), advanced: false }
  }

  const completedIndex = resolveCompletedExerciseIndex(
    state,
    completedExerciseId,
  )

  if (completedIndex === null) {
    return { ...unchangedResult(state), advanced: false }
  }

  const nextIndex = completedIndex + 1

  if (nextIndex >= state.sessionExerciseRows.length) {
    return { ...unchangedResult(state), advanced: false }
  }

  const nextState = clearCurrentExerciseProgress({
    ...state,
    headsetConfirmedExerciseIndex: nextIndex,
  })

  return { state: nextState, remoteUpserts: [], advanced: true }
}

export function failPendingExerciseChangeInFlow(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult & { failed: boolean } {
  if (!state.pendingExerciseChange) {
    return { ...unchangedResult(state), failed: false }
  }

  return {
    state: {
      ...state,
      pendingExerciseChange: null,
    },
    remoteUpserts: [],
    failed: true,
  }
}

export function buildSessionEndProgressUpserts(
  state: SkipSafeProgressFlowState,
): SessionProgressUpsertInput[] {
  return buildSessionProgressUpserts(progressCheckpointBase(state))
}

export function completeSessionInFlow(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult {
  return {
    state: {
      ...state,
      headsetConfirmedExerciseIndex: 0,
      pendingExerciseChange: null,
      currentExerciseProgress: [],
      progressByExerciseId: {},
      currSet: 0,
      currRep: 0,
    },
    remoteUpserts: buildSessionEndProgressUpserts(state),
  }
}

export function interruptSessionInFlow(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult {
  return completeSessionInFlow(state)
}
