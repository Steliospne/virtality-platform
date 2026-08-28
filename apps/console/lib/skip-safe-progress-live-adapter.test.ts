import { describe, expect, it } from 'vitest'
import type { CompleteExercise } from '@/types/models'
import { createSkipSafeProgressFlowState } from './skip-safe-progress-flow.js'
import {
  assembleSkipSafeProgressFlowState,
  projectSkipSafeProgressFlowState,
  runLiveAcknowledgeExerciseChange,
  runLiveCompleteSession,
  runLiveFailPendingExerciseChange,
  runLiveInterruptSession,
  runLiveRepEnd,
  runLiveRequestExerciseSkip,
  runLiveSetEnd,
} from './skip-safe-progress-live-adapter.js'

const sampleExercises: CompleteExercise[] = [
  {
    id: 'row-1',
    exerciseId: 'ex-1',
    sets: 2,
    reps: 3,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0,
  },
  {
    id: 'row-2',
    exerciseId: 'ex-2',
    sets: 1,
    reps: 2,
    restTime: 4,
    holdTime: 2,
    speed: 1.5,
    romMode: 0,
  },
  {
    id: 'row-3',
    exerciseId: 'ex-3',
    sets: 1,
    reps: 2,
    restTime: 4,
    holdTime: 2,
    speed: 1.5,
    romMode: 0,
  },
]

function createLiveState(startingExerciseIndex = 0) {
  let rowCounter = 0

  return createSkipSafeProgressFlowState({
    patientSessionId: 'session-1',
    exercises: sampleExercises,
    createRowId: () => `session-row-${++rowCounter}`,
    startingExerciseIndex,
  })
}

function repEndPayload(previousRep: number, progress: number) {
  return JSON.stringify({ previousRep, progress })
}

function setEndPayload(previousSet: number) {
  return JSON.stringify({ previousSet })
}

describe('skip-safe progress live adapter', () => {
  it('applies RepEnd through the flow and exposes score side-effect fields', () => {
    const state = createLiveState()
    const result = runLiveRepEnd(state, repEndPayload(0, 0.8))

    expect(result.applied).toBe(true)
    if (!result.applied) {
      return
    }

    expect(result.completedRep).toBe(1)
    expect(result.progress).toBe(0.8)
    expect(result.state.currRep).toBe(0)
    expect(result.state.currentExerciseProgress[0]).toEqual({
      rep: 1,
      set_1: 80,
    })
    expect(result.remoteUpserts).toEqual([])
  })

  it('ignores RepEnd when the live session cannot persist progress', () => {
    const state = {
      ...createLiveState(),
      patientSessionId: '',
    }

    const result = runLiveRepEnd(state, repEndPayload(0, 0.9))

    expect(result.applied).toBe(false)
    expect(result.state).toBe(state)
    expect(result.remoteUpserts).toEqual([])
  })

  it('persists SetEnd checkpoints through the flow', () => {
    let state = createLiveState()
    state = runLiveRepEnd(state, repEndPayload(0, 0.8)).state
    state = runLiveRepEnd(state, repEndPayload(1, 0.8)).state
    state = runLiveRepEnd(state, repEndPayload(2, 0.8)).state

    const setEnd = runLiveSetEnd(state, setEndPayload(1))

    expect(setEnd.applied).toBe(true)
    expect(setEnd.state.currSet).toBe(1)
    expect(setEnd.advancedToNextExercise).toBe(false)
    expect(JSON.parse(setEnd.remoteUpserts[0]!.value)).toEqual([
      { rep: 1, set_1: 80 },
      { rep: 2, set_1: 80 },
      { rep: 3, set_1: 80 },
    ])
  })

  it('signals live exercise reset after the final exercise set completes', () => {
    let state = createLiveState(2)
    state = runLiveRepEnd(state, repEndPayload(0, 0.5)).state
    state = runLiveRepEnd(state, repEndPayload(1, 0.6)).state

    const finalSet = runLiveSetEnd(state, setEndPayload(1))

    expect(finalSet.applied).toBe(true)
    expect(finalSet.advancedToNextExercise).toBe(true)
    expect(finalSet.state.headsetConfirmedExerciseIndex).toBe(0)
    expect(finalSet.state.currSet).toBe(0)
    expect(finalSet.state.currRep).toBe(0)
  })

  it('requests forward skip through the flow and keeps local checkpoint when remote persist is unavailable', () => {
    let state = createLiveState()
    state = runLiveRepEnd(state, repEndPayload(0, 0.7)).state

    const withoutSession = {
      ...state,
      patientSessionId: '',
    }
    const skipped = runLiveRequestExerciseSkip(withoutSession, {
      kind: 'forward',
    })

    expect(skipped.skipRequested).toBe(true)
    expect(skipped.remoteUpserts).toEqual([])
    expect(skipped.state.progressByExerciseId).toEqual({
      'ex-1': [{ rep: 1, set_1: 70 }],
    })
    expect(skipped.state.pendingExerciseChange).toEqual({
      targetExerciseIndex: 1,
      sourceExerciseIndex: 0,
      sourceExerciseId: 'ex-1',
    })
  })

  it('promotes pending exercise on ack and clears pending on fail', () => {
    const skipped = runLiveRequestExerciseSkip(createLiveState(), {
      kind: 'direct',
      targetExerciseIndex: 2,
    })

    const acked = runLiveAcknowledgeExerciseChange(skipped.state)
    expect(acked.acknowledged).toBe(true)
    expect(acked.state.headsetConfirmedExerciseIndex).toBe(2)
    expect(acked.state.pendingExerciseChange).toBeNull()
    expect(acked.state.currRep).toBe(0)
    expect(acked.state.currSet).toBe(0)

    const failedSkip = runLiveRequestExerciseSkip(createLiveState(), {
      kind: 'back',
    })
    expect(failedSkip.skipRequested).toBe(false)

    const forward = runLiveRequestExerciseSkip(createLiveState(), {
      kind: 'forward',
    })
    const failed = runLiveFailPendingExerciseChange(forward.state)
    expect(failed.failed).toBe(true)
    expect(failed.state.pendingExerciseChange).toBeNull()
    expect(failed.state.headsetConfirmedExerciseIndex).toBe(0)
  })

  it('builds session-end and interrupt upserts through the flow', () => {
    let state = createLiveState()
    state = runLiveRepEnd(state, repEndPayload(0, 0.6)).state
    const skipped = runLiveRequestExerciseSkip(state, { kind: 'forward' })
    state = runLiveAcknowledgeExerciseChange(skipped.state).state

    const completed = runLiveCompleteSession(state)
    expect(JSON.parse(completed.remoteUpserts[0]!.value)).toEqual([
      { rep: 1, set_1: 60 },
    ])
    expect(completed.state.progressByExerciseId).toEqual({})
    expect(completed.state.pendingExerciseChange).toBeNull()

    const interrupted = runLiveInterruptSession(
      runLiveAcknowledgeExerciseChange(skipped.state).state,
    )
    expect(JSON.parse(interrupted.remoteUpserts[0]!.value)).toEqual([
      { rep: 1, set_1: 60 },
    ])
  })

  it('round-trips live snapshot assemble/project without losing progress fields', () => {
    let state = createLiveState()
    state = runLiveRepEnd(state, repEndPayload(0, 0.5)).state

    const projected = projectSkipSafeProgressFlowState(state)
    const reassembled = assembleSkipSafeProgressFlowState(projected)

    expect(reassembled.currRep).toBe(0)
    expect(reassembled.currentExerciseProgress[0]).toEqual({
      rep: 1,
      set_1: 50,
    })
    expect(reassembled.patientSessionId).toBe('session-1')
  })
})
