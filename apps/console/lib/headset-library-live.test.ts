import { describe, expect, it } from 'vitest'
import {
  applyDownloadComplete,
  applyDownloadFailed,
  applyDownloadProgress,
  clampBytesDownloaded,
  normalizeLiveLibraryState,
  requestedVideoIds,
  selectDownloadsToResume,
  type LiveLibraryState,
} from './headset-library-live.js'

describe('headset library live updates', () => {
  it('records download progress on the matching video', () => {
    const next = applyDownloadProgress(
      { videos: [], freeBytes: 9 },
      {
        videoId: 'trail',
        bytesDownloaded: 10,
        sizeBytes: 40,
        stalled: false,
      },
    )

    expect(next.videos).toEqual([
      {
        videoId: 'trail',
        status: 'downloading',
        bytesDownloaded: 10,
        sizeBytes: 40,
        stalled: false,
      },
    ])
  })

  it('marks a completed video ready and keeps the version it already had', () => {
    const next = applyDownloadComplete(
      {
        videos: [{ videoId: 'trail', status: 'downloading', version: 4 }],
        freeBytes: 9,
      },
      'trail',
    )

    expect(next.videos[0]).toMatchObject({
      status: 'ready',
      version: 4,
    })
  })

  it('drops a cancelled video so the row returns to absent', () => {
    const next = applyDownloadFailed(
      {
        videos: [{ videoId: 'trail', status: 'downloading' }],
        freeBytes: 9,
      },
      { videoId: 'trail', reason: 'cancelled' },
    )

    expect(next.videos).toEqual([])
  })

  it('treats a missing videos field as an empty library', () => {
    expect(normalizeLiveLibraryState({ freeBytes: 12 })).toEqual({
      videos: [],
      freeBytes: 12,
    })
  })

  it('treats a non-array videos field as an empty library', () => {
    expect(normalizeLiveLibraryState({ videos: {}, freeBytes: 12 })).toEqual({
      videos: [],
      freeBytes: 12,
    })
  })

  it('reads PascalCase Videos from a Unity-style payload', () => {
    expect(
      normalizeLiveLibraryState({
        Videos: [{ videoId: 'trail', status: 'ready' }],
        FreeBytes: 4,
      }),
    ).toEqual({
      videos: [{ videoId: 'trail', status: 'ready' }],
      freeBytes: 4,
    })
  })

  it('applies progress when the current library has no videos array', () => {
    const next = applyDownloadProgress({ freeBytes: 9 } as LiveLibraryState, {
      videoId: 'trail',
      bytesDownloaded: 10,
      sizeBytes: 40,
      stalled: false,
    })

    expect(next.videos).toEqual([
      {
        videoId: 'trail',
        status: 'downloading',
        bytesDownloaded: 10,
        sizeBytes: 40,
        stalled: false,
      },
    ])
  })

  it('clamps a wrapped 32-bit progress counter to the file size', () => {
    const wrapped = 1_116_782 + 2 ** 32
    expect(clampBytesDownloaded(wrapped, 1_116_782)).toBe(1_116_782)
    expect(clampBytesDownloaded(10, 40)).toBe(10)
    expect(clampBytesDownloaded(10, 0)).toBe(10)
    expect(clampBytesDownloaded(-5, 40)).toBe(0)

    const next = applyDownloadProgress(
      { videos: [], freeBytes: 0 },
      {
        videoId: 'trail',
        bytesDownloaded: wrapped,
        sizeBytes: 1_116_782,
        stalled: false,
      },
    )
    expect(next.videos[0]?.bytesDownloaded).toBe(1_116_782)
  })
})

describe('resuming unacknowledged download requests', () => {
  const mirror = {
    devices: [
      {
        deviceId: 'hs-1',
        report: {
          videos: [
            { videoId: 'trail', status: 'requested' },
            { videoId: 'lake', status: 'requested' },
            { videoId: 'city', status: 'ready' },
          ],
        },
      },
      { deviceId: 'hs-2', report: null },
    ],
  }

  it('lists the requested rows of one headset', () => {
    expect(requestedVideoIds(mirror, 'hs-1')).toEqual(['trail', 'lake'])
    expect(requestedVideoIds(mirror, 'hs-2')).toEqual([])
    expect(requestedVideoIds(mirror, null)).toEqual([])
    expect(requestedVideoIds(undefined, 'hs-1')).toEqual([])
  })

  it('resends only what the headset does not report and was not sent yet', () => {
    const live: LiveLibraryState = {
      freeBytes: 0,
      videos: [
        { videoId: 'trail', status: 'downloading' },
        { videoId: 'lake', status: 'absent' },
      ],
    }
    expect(
      selectDownloadsToResume({
        requested: ['trail', 'lake', 'river'],
        live,
        alreadySent: new Set(['river']),
      }),
    ).toEqual(['lake'])
  })

  it('treats a console-local requested row as not reported', () => {
    const live: LiveLibraryState = {
      freeBytes: 0,
      videos: [{ videoId: 'trail', status: 'requested' }],
    }
    expect(
      selectDownloadsToResume({
        requested: ['trail'],
        live,
        alreadySent: new Set(),
      }),
    ).toEqual(['trail'])
    expect(
      selectDownloadsToResume({
        requested: ['trail'],
        live: null,
        alreadySent: new Set(),
      }),
    ).toEqual(['trail'])
  })
})
