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

function playingTrail() {
  const starting = reduceImmersivePlayback(initialImmersivePlaybackState, {
    type: 'playSent',
    videoId: 'trail',
  })
  return reduceImmersivePlayback(starting, {
    type: 'playAck',
    videoId: 'trail',
  })
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

  it('stays Playing after stop is sent until the headset acks it', () => {
    const playing = playingTrail()
    const stopping = reduceImmersivePlayback(playing, { type: 'stopSent' })

    expect(stopping.status).toBe('Playing')
    expect(stopping.pendingStop).toEqual({ videoId: 'trail' })

    const idle = reduceImmersivePlayback(stopping, {
      type: 'stopAck',
      videoId: 'trail',
    })
    expect(idle.status).toBe('Idle')
    expect(idle.pendingStop).toBeNull()
    expect(idle.confirmReason).toBeNull()
  })

  it('keeps the first pending stop when stop is sent twice', () => {
    const stopping = reduceImmersivePlayback(playingTrail(), {
      type: 'stopSent',
    })

    expect(reduceImmersivePlayback(stopping, { type: 'stopSent' })).toBe(
      stopping,
    )
  })

  it('ignores stopSent when nothing is playing', () => {
    expect(
      reduceImmersivePlayback(initialImmersivePlaybackState, {
        type: 'stopSent',
      }),
    ).toBe(initialImmersivePlaybackState)
  })

  it('keeps the video held and asks the physio to retry when the stop ack times out', () => {
    let state = reduceImmersivePlayback(playingTrail(), { type: 'pauseToggle' })
    state = reduceImmersivePlayback(state, { type: 'stopSent' })
    const timedOut = reduceImmersivePlayback(state, { type: 'stopTimeout' })

    expect(timedOut.status).toBe('Paused')
    expect(timedOut.videoId).toBe('trail')
    expect(timedOut.pendingStop).toBeNull()
    expect(timedOut.confirmReason).toBe('didnt-respond')
    expect(timedOut.confirmIntent).toBe('stop')
  })

  it('ignores a stop timeout once the ack has arrived', () => {
    let state = reduceImmersivePlayback(playingTrail(), { type: 'stopSent' })
    state = reduceImmersivePlayback(state, {
      type: 'stopAck',
      videoId: 'trail',
    })

    expect(reduceImmersivePlayback(state, { type: 'stopTimeout' })).toBe(state)
  })

  it('yields the disconnected stop reason when MemberLeft has a pending stop', () => {
    const stopping = reduceImmersivePlayback(playingTrail(), {
      type: 'stopSent',
    })
    const left = reduceImmersivePlayback(stopping, { type: 'memberLeft' })

    expect(left.pendingStop).toBeNull()
    expect(left.confirmReason).toBe('disconnected')
    expect(left.confirmIntent).toBe('stop')
  })

  it('reports a play timeout as a play confirm after a stop timeout', () => {
    let state = reduceImmersivePlayback(playingTrail(), { type: 'stopSent' })
    state = reduceImmersivePlayback(state, { type: 'stopTimeout' })
    state = reduceImmersivePlayback(state, { type: 'ended' })
    state = reduceImmersivePlayback(state, { type: 'dismissConfirm' })
    state = reduceImmersivePlayback(state, {
      type: 'playSent',
      videoId: 'lake',
    })
    state = reduceImmersivePlayback(state, { type: 'playTimeout' })

    expect(state.confirmReason).toBe('didnt-respond')
    expect(state.confirmIntent).toBe('play')
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
