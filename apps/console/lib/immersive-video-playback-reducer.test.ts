import { describe, expect, it } from 'vitest'
import type { VideoPlaybackProgressPayload } from '@virtality/shared/types'
import {
  initialImmersivePlaybackState,
  reduceImmersivePlayback,
} from './immersive-video-playback-reducer.js'

function progress(
  patch: Partial<VideoPlaybackProgressPayload> = {},
): VideoPlaybackProgressPayload {
  return {
    videoId: 'trail',
    positionSec: 12,
    durationSec: 180,
    ...patch,
  }
}

describe('reduceImmersivePlayback', () => {
  it('moves Idle → Starting → Playing → Paused → Playing → Idle', () => {
    let state = initialImmersivePlaybackState
    state = reduceImmersivePlayback(state, {
      type: 'playSent',
      videoId: 'trail',
    })
    expect(state.status).toBe('Starting')
    state = reduceImmersivePlayback(state, {
      type: 'playAck',
      videoId: 'trail',
    })
    expect(state.status).toBe('Playing')
    state = reduceImmersivePlayback(state, { type: 'pauseToggle' })
    expect(state.status).toBe('Paused')
    state = reduceImmersivePlayback(state, { type: 'pauseToggle' })
    expect(state.status).toBe('Playing')
    state = reduceImmersivePlayback(state, { type: 'ended' })
    expect(state.status).toBe('Idle')
    expect(state.pendingPlay).toBeNull()
  })

  it('returns Idle when videoEnded arrives from any active state', () => {
    const starting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'playSent',
      videoId: 'trail',
    })
    const playing = reduceImmersivePlayback(starting, {
      type: 'playAck',
      videoId: 'trail',
    })
    const paused = reduceImmersivePlayback(playing, { type: 'pauseToggle' })

    expect(reduceImmersivePlayback(starting, { type: 'ended' }).status).toBe(
      'Idle',
    )
    expect(reduceImmersivePlayback(playing, { type: 'ended' }).status).toBe(
      'Idle',
    )
    expect(reduceImmersivePlayback(paused, { type: 'ended' }).status).toBe(
      'Idle',
    )
  })

  it('returns Idle on videoStopAck for the playing video only', () => {
    const starting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'playSent',
      videoId: 'trail',
    })
    const playing = reduceImmersivePlayback(starting, {
      type: 'playAck',
      videoId: 'trail',
    })

    expect(
      reduceImmersivePlayback(playing, { type: 'stopAck', videoId: 'trail' })
        .status,
    ).toBe('Idle')
    expect(
      reduceImmersivePlayback(playing, { type: 'stopAck', videoId: 'lake' }),
    ).toBe(playing)
    expect(
      reduceImmersivePlayback(initialImmersivePlaybackState, {
        type: 'stopAck',
        videoId: 'trail',
      }),
    ).toBe(initialImmersivePlaybackState)
  })

  it('re-attaches as Playing from progress', () => {
    const waiting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'roomComplete',
    })
    const attached = reduceImmersivePlayback(waiting, {
      type: 'progress',
      payload: progress(),
      now: 1_000,
    })

    expect(attached.status).toBe('Playing')
    expect(attached.reattaching).toBe(false)
  })

  it('keeps Paused when progress arrives while paused', () => {
    let state = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'playSent',
      videoId: 'trail',
    })
    state = reduceImmersivePlayback(state, {
      type: 'playAck',
      videoId: 'trail',
    })
    state = reduceImmersivePlayback(state, { type: 'pauseToggle' })
    const next = reduceImmersivePlayback(state, {
      type: 'progress',
      payload: progress({ positionSec: 20 }),
      now: 1_000,
    })

    expect(next.status).toBe('Paused')
    expect(next.positionSec).toBe(20)
  })

  it('returns Idle when no progress arrives within 2 s', () => {
    const waiting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'roomComplete',
    })
    const idle = reduceImmersivePlayback(waiting, { type: 'reattachTimeout' })

    expect(idle.status).toBe('Idle')
    expect(idle.reattaching).toBe(false)
  })

  it('clears the unconfirmed-play marker on ack', () => {
    const starting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'playSent',
      videoId: 'trail',
    })
    expect(starting.pendingPlay).toEqual({ videoId: 'trail', kind: 'play' })

    const playing = reduceImmersivePlayback(starting, {
      type: 'playAck',
      videoId: 'trail',
    })
    expect(playing.pendingPlay).toBeNull()
  })

  it('yields the disconnected dialog reason when MemberLeft has a pending marker', () => {
    const starting = reduceImmersivePlayback(initialImmersivePlaybackState, {
      type: 'playSent',
      videoId: 'trail',
    })
    const left = reduceImmersivePlayback(starting, { type: 'memberLeft' })

    expect(left.confirmReason).toBe('disconnected')
    expect(left.pendingPlay).toBeNull()
    expect(left.status).toBe('Idle')
  })
})
