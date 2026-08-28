import { canPersistSessionProgress } from './patient-dashboard-session-launch'
import {
  acknowledgeExerciseChangeInFlow,
  applyHeadsetExerciseAdvanceInFlow,
  applyRepEndToFlow,
  applySetEndToFlow,
  completeSessionInFlow,
  failPendingExerciseChangeInFlow,
  interruptSessionInFlow,
  requestExerciseSkipInFlow,
  type ExerciseSkipRequest,
  type SkipSafeProgressFlowActionResult,
  type SkipSafeProgressFlowState,
} from './skip-safe-progress-flow'

/**
 * Live Started Session progress adapter over skip-safe-progress-flow.
 * Assembles flow state from socket-hook refs, runs mutations, and returns
 * next state + remote upserts for the hook to commit (wire/UI/persistence).
 */

export type LiveProgressSessionSnapshot = SkipSafeProgressFlowState

export type { ExerciseSkipRequest }

export type LiveRepEndResult =
  | {
      applied: false
      state: SkipSafeProgressFlowState
      remoteUpserts: []
    }
  | {
      applied: true
      state: SkipSafeProgressFlowState
      remoteUpserts: SkipSafeProgressFlowActionResult['remoteUpserts']
      completedRep: number
      progress: number
    }

export type LiveSetEndResult =
  | {
      applied: false
      state: SkipSafeProgressFlowState
      remoteUpserts: []
      advancedToNextExercise: false
    }
  | {
      applied: true
      state: SkipSafeProgressFlowState
      remoteUpserts: SkipSafeProgressFlowActionResult['remoteUpserts']
      advancedToNextExercise: boolean
    }

export function assembleSkipSafeProgressFlowState(
  snapshot: LiveProgressSessionSnapshot,
): SkipSafeProgressFlowState {
  return snapshot
}

export function projectSkipSafeProgressFlowState(
  state: SkipSafeProgressFlowState,
): LiveProgressSessionSnapshot {
  return {
    patientSessionId: state.patientSessionId,
    sessionExerciseRows: state.sessionExerciseRows,
    headsetConfirmedExerciseIndex: state.headsetConfirmedExerciseIndex,
    pendingExerciseChange: state.pendingExerciseChange,
    progressByExerciseId: { ...state.progressByExerciseId },
    currentExerciseProgress: [...state.currentExerciseProgress],
    currSet: state.currSet,
    currRep: state.currRep,
  }
}

function canPersistFlowState(state: SkipSafeProgressFlowState): boolean {
  return canPersistSessionProgress(
    state.patientSessionId,
    state.sessionExerciseRows,
    state.headsetConfirmedExerciseIndex,
  )
}

export function runLiveRepEnd(
  state: SkipSafeProgressFlowState,
  payload: string,
): LiveRepEndResult {
  if (!canPersistFlowState(state)) {
    return { applied: false, state, remoteUpserts: [] }
  }

  const result = applyRepEndToFlow(state, payload)

  if (result.completedRep === undefined) {
    return { applied: false, state, remoteUpserts: [] }
  }

  return {
    applied: true,
    state: result.state,
    remoteUpserts: result.remoteUpserts,
    completedRep: result.completedRep,
    progress: result.progress ?? 0,
  }
}

export function runLiveSetEnd(
  state: SkipSafeProgressFlowState,
  payload: string,
): LiveSetEndResult {
  if (!canPersistFlowState(state)) {
    return {
      applied: false,
      state,
      remoteUpserts: [],
      advancedToNextExercise: false,
    }
  }

  const result = applySetEndToFlow(state, payload)

  if (result.state === state) {
    return {
      applied: false,
      state,
      remoteUpserts: [],
      advancedToNextExercise: false,
    }
  }

  return {
    applied: true,
    state: result.state,
    remoteUpserts: result.remoteUpserts,
    advancedToNextExercise: result.advancedToNextExercise === true,
  }
}

export function runLiveRequestExerciseSkip(
  state: SkipSafeProgressFlowState,
  request: ExerciseSkipRequest,
): SkipSafeProgressFlowActionResult & { skipRequested: boolean } {
  return requestExerciseSkipInFlow(state, request, {
    persistSucceeds: canPersistFlowState(state),
  })
}

export function runLiveAcknowledgeExerciseChange(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult & { acknowledged: boolean } {
  return acknowledgeExerciseChangeInFlow(state)
}

export function runLiveHeadsetExerciseAdvance(
  state: SkipSafeProgressFlowState,
  completedExerciseId: string,
): SkipSafeProgressFlowActionResult & { advanced: boolean } {
  return applyHeadsetExerciseAdvanceInFlow(state, completedExerciseId)
}

export function runLiveFailPendingExerciseChange(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult & { failed: boolean } {
  return failPendingExerciseChangeInFlow(state)
}

export function runLiveCompleteSession(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult {
  return completeSessionInFlow(state)
}

export function runLiveInterruptSession(
  state: SkipSafeProgressFlowState,
): SkipSafeProgressFlowActionResult {
  return interruptSessionInFlow(state)
}
