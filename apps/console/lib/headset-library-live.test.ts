import { describe, expect, it } from 'vitest'
import {
  applyDownloadComplete,
  applyDownloadFailed,
  applyDownloadProgress,
  normalizeLiveLibraryState,
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
})
