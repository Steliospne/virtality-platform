import { describe, expect, it } from 'vitest'
import {
  canChooseImmersiveVideoId,
  immersiveVideoAcceptAll,
  immersiveVideoFileKindOf,
  isAllowedImmersiveVideoFilename,
  isValidImmersiveVideoId,
  requestedImmersiveVideoId,
} from './immersive-video-file-kind'

describe('immersive video file kind', () => {
  it('classifies a Unity AssetBundle by its last extension', () => {
    expect(
      immersiveVideoFileKindOf(
        'videos_assets_assets_videos_mono.mp4_fa26855d5cc2a080c4d32252a3286062.bundle',
      ),
    ).toBe('bundle')
  })

  it('classifies raw video and rejects everything else', () => {
    expect(immersiveVideoFileKindOf('trail.MP4')).toBe('video')
    expect(immersiveVideoFileKindOf('trail.mkv')).toBe('video')
    expect(immersiveVideoFileKindOf('trail.exe')).toBeNull()
    expect(immersiveVideoFileKindOf('trail')).toBeNull()
    expect(immersiveVideoFileKindOf('.bundle')).toBeNull()
  })

  it('only accepts a filename for the kind the admin selected', () => {
    expect(isAllowedImmersiveVideoFilename('a.bundle', 'bundle')).toBe(true)
    expect(isAllowedImmersiveVideoFilename('a.bundle', 'video')).toBe(false)
    expect(isAllowedImmersiveVideoFilename('a.mp4', 'bundle')).toBe(false)
  })

  it('accept-all covers both kinds', () => {
    expect(immersiveVideoAcceptAll()).toBe(
      '.bundle,video/*,.mp4,.m4v,.mov,.webm,.mkv',
    )
  })
})

describe('immersive video id', () => {
  it.each(['cycle-coast_01', 'a', 'v1.2', 'x'.repeat(64)])(
    'accepts %j',
    (id) => {
      expect(isValidImmersiveVideoId(id)).toBe(true)
    },
  )

  it.each([
    'Coast',
    'coast 01',
    'coast/01',
    '-coast',
    '.coast',
    '',
    'x'.repeat(65),
  ])('rejects %j', (id) => {
    expect(isValidImmersiveVideoId(id)).toBe(false)
  })

  it('treats blank or unchanged input as no request', () => {
    expect(requestedImmersiveVideoId('   ', 'gen')).toBeNull()
    expect(requestedImmersiveVideoId('gen', 'gen')).toBeNull()
    expect(requestedImmersiveVideoId(' coast ', 'gen')).toBe('coast')
  })

  it('can only be chosen before the row has ever held a file', () => {
    expect(canChooseImmersiveVideoId({ filename: null, sizeBytes: null })).toBe(
      true,
    )
    expect(
      canChooseImmersiveVideoId({ filename: 'a.bundle', sizeBytes: null }),
    ).toBe(false)
    expect(canChooseImmersiveVideoId({ filename: null, sizeBytes: 1 })).toBe(
      false,
    )
  })
})
