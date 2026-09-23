import { describe, expect, it } from 'vitest'
import type { Socket } from 'socket.io-client'
import type { CompleteExercise } from '@/types/models'
import { PROGRAM_EVENT } from '@virtality/shared/types'
import { subscribe } from './device-event-controller.js'
import {
  applyRepEndToFlow,
  applySetEndToFlow,
  createSkipSafeProgressFlowState,
  type SkipSafeProgressFlowState,
} from './skip-safe-progress-flow.js'

/**
 * The seam between `subscribe()` and the progress flow. Both sides are covered
 * on their own, and both stayed green while every rep and set was silently
 * dropped between them: `subscribe()` parses the headset's JSON text, and the
 * flow parsed it a second time. Only a test that emits the wire format the
 * headset really sends, through the real `subscribe()`, catches that.
 */

type Listener = (...args: unknown[]) => void

function createFakeHeadsetSocket() {
  const listeners = new Map<string, Listener[]>()
  const socket = {
    on: (event: string, fn: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), fn])
    },
    off: (event: string, fn: Listener) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((listener) => listener !== fn),
      )
    },
  }

  return {
    socket: socket as unknown as Socket,
    /**
     * The headset serialises every object payload itself
     * (`SendSocketCall(FunctionsSent, string data)`), so it reaches the console
     * as JSON *text*, and the relay forwards it untouched.
     */
    emitAsHeadset: (event: string, payload: unknown) =>
      (listeners.get(event) ?? []).forEach((listener) =>
        listener(JSON.stringify(payload)),
      ),
  }
}

const exercises: CompleteExercise[] = [
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
]

/** The counters the control panel renders, derived the way the hook derives them. */
type Counters = { currentRep: number; currentSet: number }

function mountProgressSeam() {
  const { socket, emitAsHeadset } = createFakeHeadsetSocket()
  let flowState: SkipSafeProgressFlowState = createSkipSafeProgressFlowState({
    patientSessionId: 'session-1',
    exercises,
    createRowId: () => 'session-row-1',
  })
  const counters: Counters = { currentRep: 0, currentSet: 1 }

  const unsubscribe = subscribe(socket, PROGRAM_EVENT, {
    RepEnd: (payload: unknown) => {
      const result = applyRepEndToFlow(flowState, payload)
      if (!result.applied) return
      flowState = result.state
      counters.currentRep = result.completedRep
    },
    SetEnd: (payload: unknown) => {
      const result = applySetEndToFlow(flowState, payload)
      if (!result.applied) return
      flowState = result.state
      counters.currentSet = result.state.currSet + 1
    },
  })

  return {
    emitAsHeadset,
    unsubscribe,
    counters,
    getFlowState: () => flowState,
  }
}

describe('headset progress seam', () => {
  it('advances the rep counter for each rep the headset reports', () => {
    const seam = mountProgressSeam()

    seam.emitAsHeadset(PROGRAM_EVENT.RepEnd, {
      previousRep: 0,
      progress: 0.8,
    })
    expect(seam.counters.currentRep).toBe(1)

    seam.emitAsHeadset(PROGRAM_EVENT.RepEnd, {
      previousRep: 1,
      progress: 0.9,
    })
    expect(seam.counters.currentRep).toBe(2)

    seam.unsubscribe()
  })

  it('advances the set counter when the headset reports a completed set', () => {
    const seam = mountProgressSeam()

    seam.emitAsHeadset(PROGRAM_EVENT.SetEnd, { previousSet: 1 })

    expect(seam.counters.currentSet).toBe(2)

    seam.unsubscribe()
  })

  it('records each completed rep on the live plot against its active set', () => {
    const seam = mountProgressSeam()

    seam.emitAsHeadset(PROGRAM_EVENT.RepEnd, {
      previousRep: 0,
      progress: 0.75,
    })

    expect(seam.getFlowState().currentExerciseProgress[0]).toEqual({
      rep: 1,
      set_1: 75,
    })

    seam.unsubscribe()
  })

  it('ignores a malformed payload instead of advancing the counters', () => {
    const seam = mountProgressSeam()

    seam.emitAsHeadset(PROGRAM_EVENT.RepEnd, { previousRep: 'one' })
    seam.emitAsHeadset(PROGRAM_EVENT.SetEnd, { previousSet: 0 })

    expect(seam.counters).toEqual({ currentRep: 0, currentSet: 1 })

    seam.unsubscribe()
  })

  it('stops advancing the counters once unsubscribed', () => {
    const seam = mountProgressSeam()

    seam.unsubscribe()
    seam.emitAsHeadset(PROGRAM_EVENT.RepEnd, {
      previousRep: 0,
      progress: 0.8,
    })

    expect(seam.counters.currentRep).toBe(0)
  })
})
