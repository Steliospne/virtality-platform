import { describe, expect, it } from 'vitest'
import {
  resolveHeadsetSnapshot,
  selectedHeadsetOnline,
  toLibrarySnapshot,
  vrVideoBanner,
} from './vr-video-page-state.js'

describe('vrVideoBanner', () => {
  it('asks the physio to turn the headset on when the poll is offline', () => {
    expect(
      vrVideoBanner({
        roomComplete: false,
        replaced: false,
        pollOnline: false,
      }),
    ).toBe('Turn the headset on and open the app to download videos.')
  })

  it('shows connecting copy when the poll is online but the room is not complete', () => {
    expect(
      vrVideoBanner({
        roomComplete: false,
        replaced: false,
        pollOnline: true,
      }),
    ).toBe('Connecting to headset…')
  })

  it('hides the banner once the room is complete', () => {
    expect(
      vrVideoBanner({
        roomComplete: true,
        replaced: false,
        pollOnline: false,
      }),
    ).toBeNull()
  })
})

describe('selectedHeadsetOnline', () => {
  it('treats a complete room as online even if the poll is stale', () => {
    expect(
      selectedHeadsetOnline({ roomComplete: true, pollOnline: false }),
    ).toBe(true)
  })
})

describe('toLibrarySnapshot', () => {
  it('returns an empty video list when the mirror omits videos', () => {
    expect(
      toLibrarySnapshot({
        reportedAt: '2026-09-13T10:00:00.000Z',
        freeBytes: 8,
        videos: undefined as unknown as [],
      }),
    ).toEqual({
      reportedAt: '2026-09-13T10:00:00.000Z',
      freeBytes: 8,
      videos: [],
    })
  })
})

describe('resolveHeadsetSnapshot', () => {
  const live = {
    freeBytes: 5,
    videos: [{ videoId: 'v1', status: 'ready' as const }],
  }
  const mirror = {
    freeBytes: 1,
    reportedAt: '2026-09-13T10:00:00.000Z',
    videos: [
      { videoId: 'v1', status: 'ready' as const },
      { videoId: 'v2', status: 'requested' as const },
    ],
  }

  it('shows the mirror while the headset is not in the room', () => {
    expect(resolveHeadsetSnapshot({ live, mirror, online: false })).toBe(mirror)
  })

  it('shows the live report with requested rows overlaid once in the room', () => {
    expect(resolveHeadsetSnapshot({ live, mirror, online: true })).toEqual({
      freeBytes: 5,
      videos: [
        { videoId: 'v1', status: 'ready' },
        { videoId: 'v2', status: 'requested' },
      ],
    })
  })

  it('shows nothing offline without a mirror', () => {
    expect(resolveHeadsetSnapshot({ live, mirror: null, online: false })).toBe(
      null,
    )
  })
})
