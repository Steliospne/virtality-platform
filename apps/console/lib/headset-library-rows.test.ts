import { describe, expect, it } from 'vitest'
import {
  buildHeadsetLibraryRows,
  type HeadsetCatalogVideo,
  type HeadsetLibrarySnapshot,
} from './headset-library-rows.js'

const trail: HeadsetCatalogVideo = {
  id: 'trail',
  title: 'Coast trail',
  activity: 'CYCLING',
  durationSec: 90,
  sizeBytes: 2_000_000_000,
  thumbnailUrl: 'https://cdn.example/trail.jpg',
}

function snapshot(
  videos: HeadsetLibrarySnapshot['videos'],
): HeadsetLibrarySnapshot {
  return {
    videos,
    freeBytes: 8_000_000_000,
    reportedAt: '2026-09-12T10:00:00.000Z',
  }
}

describe('buildHeadsetLibraryRows', () => {
  it('renders online ready as on-headset', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([{ videoId: 'trail', status: 'ready' }]),
      true,
    )

    expect(rows[0].cell).toEqual({ type: 'on-headset' })
  })

  it('renders online downloading with percent and stalled', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([
        {
          videoId: 'trail',
          status: 'downloading',
          bytesDownloaded: 500_000_000,
          sizeBytes: 2_000_000_000,
          stalled: true,
        },
      ]),
      true,
    )

    expect(rows[0].cell).toEqual({
      type: 'downloading',
      percent: 25,
      stalled: true,
    })
  })

  it('renders online paused with byte counts', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([
        {
          videoId: 'trail',
          status: 'paused',
          bytesDownloaded: 400,
          sizeBytes: 800,
        },
      ]),
      true,
    )

    expect(rows[0].cell).toEqual({
      type: 'paused',
      bytesDownloaded: 400,
      sizeBytes: 800,
    })
  })

  it('renders online failed with the wire reason', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([{ videoId: 'trail', status: 'failed', reason: 'network' }]),
      true,
    )

    expect(rows[0].cell).toEqual({ type: 'failed', reason: 'network' })
  })

  it('renders online missing entries as absent', () => {
    const rows = buildHeadsetLibraryRows([trail], snapshot([]), true)

    expect(rows[0].cell).toEqual({ type: 'absent' })
  })

  it('renders offline ready from the Mirror with reportedAt', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([{ videoId: 'trail', status: 'ready' }]),
      false,
    )

    expect(rows[0].cell).toEqual({
      type: 'offline-on-headset',
      reportedAt: '2026-09-12T10:00:00.000Z',
    })
  })

  it('renders offline missing entries as not on headset', () => {
    const rows = buildHeadsetLibraryRows([trail], snapshot([]), false)

    expect(rows[0].cell).toEqual({ type: 'offline-absent' })
  })

  it('appends Not in catalog for a Mirror id absent from the catalog', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([
        { videoId: 'trail', status: 'ready' },
        { videoId: 'gone', status: 'ready', sizeBytes: 10 },
      ]),
      true,
    )

    expect(rows.map((row) => row.videoId)).toEqual(['trail', 'gone'])
    expect(rows[1]).toMatchObject({
      title: 'Not in catalog',
      inCatalog: false,
      cell: { type: 'not-in-catalog' },
    })
  })

  it('lets Not in catalog win over unavailable', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      snapshot([
        {
          videoId: 'gone',
          status: 'failed',
          reason: 'unavailable',
        },
      ]),
      true,
    )

    expect(rows[1].cell).toEqual({ type: 'not-in-catalog' })
  })

  it('treats a null report as every catalog row absent', () => {
    const rows = buildHeadsetLibraryRows([trail], null, false)

    expect(rows).toHaveLength(1)
    expect(rows[0].cell).toEqual({ type: 'offline-absent' })
  })

  it('does not crash when the headset omits videos', () => {
    const rows = buildHeadsetLibraryRows(
      [trail],
      { freeBytes: 8 } as HeadsetLibrarySnapshot,
      true,
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].cell).toEqual({ type: 'absent' })
  })
})
