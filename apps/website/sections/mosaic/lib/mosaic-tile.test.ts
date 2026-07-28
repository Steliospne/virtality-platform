import { describe, expect, it } from 'vitest'
import {
  getMosaicImageTileProps,
  getMosaicVideoElementSrcProps,
  getMosaicVideoTileProps,
} from './mosaic-tile'

describe('mosaic image tile rendering', () => {
  it('maps live image tiles to accessible CDN image props', () => {
    expect(
      getMosaicImageTileProps({
        mediaKind: 'image',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/clinic.jpg',
        alt: 'Therapist guiding a patient',
      }),
    ).toEqual({
      src: 'https://cdn.virtality.app/marketing/mosaic/clinic.jpg',
      alt: 'Therapist guiding a patient',
    })
  })

  it('ignores video tiles', () => {
    expect(
      getMosaicImageTileProps({
        mediaKind: 'video',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/clip.mp4',
        alt: 'Clinic walkthrough',
      }),
    ).toBeNull()
  })
})

describe('mosaic video tile rendering', () => {
  it('maps live video tiles to accessible CDN video props', () => {
    expect(
      getMosaicVideoTileProps({
        mediaKind: 'video',
        objectKey: 'marketing/mosaic/clip.mp4',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/clip.mp4',
        alt: 'Clinic walkthrough',
      }),
    ).toEqual({
      src: 'https://cdn.virtality.app/marketing/mosaic/clip.mp4',
      alt: 'Clinic walkthrough',
      mimeType: 'video/mp4',
    })
  })

  it('supports webm and mov video tiles', () => {
    expect(
      getMosaicVideoTileProps({
        mediaKind: 'video',
        objectKey: 'marketing/mosaic/clip.webm',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/clip.webm',
        alt: 'Therapy session',
      })?.mimeType,
    ).toBe('video/webm')

    expect(
      getMosaicVideoTileProps({
        mediaKind: 'video',
        objectKey: 'marketing/mosaic/clip.mov',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/clip.mov',
        alt: 'Clinic tour',
      })?.mimeType,
    ).toBe('video/quicktime')
  })

  it('ignores non-video tiles', () => {
    expect(
      getMosaicVideoTileProps({
        mediaKind: 'image',
        objectKey: 'marketing/mosaic/photo.jpg',
        cdnUrl: 'https://cdn.virtality.app/marketing/mosaic/photo.jpg',
        alt: 'Therapist guiding a patient',
      }),
    ).toBeNull()
  })

  it('exposes bare video src attrs so Chromium is not gated on video/quicktime', () => {
    expect(
      getMosaicVideoElementSrcProps({
        src: 'https://cdn.virtality.app/marketing/videos/clip.mov',
        alt: 'Clinic walkthrough',
      }),
    ).toEqual({
      src: 'https://cdn.virtality.app/marketing/videos/clip.mov',
      'aria-label': 'Clinic walkthrough',
    })
  })
})
