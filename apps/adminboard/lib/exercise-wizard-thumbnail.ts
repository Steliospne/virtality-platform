import { exerciseThumbnailVideoProxyUrl } from './exercise-thumbnail-video-proxy'

export const EXERCISE_THUMBNAIL_MAX_DIMENSION = 5000
export const EXERCISE_THUMBNAIL_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export const EXERCISE_THUMBNAIL_FORMATS = ['jpg', 'png', 'webp'] as const
export type ExerciseThumbnailFormat =
  (typeof EXERCISE_THUMBNAIL_FORMATS)[number]

export function isExerciseThumbnailFormat(
  value: string,
): value is ExerciseThumbnailFormat {
  return (EXERCISE_THUMBNAIL_FORMATS as readonly string[]).includes(value)
}

export type ExerciseThumbnailFormState = {
  timestampSec: string
  width: string
  height: string
  format: ExerciseThumbnailFormat
  quality: string
}

export const EXERCISE_THUMBNAIL_ORIENTATIONS = [
  'landscape',
  'portrait',
] as const
export type ExerciseThumbnailOrientation =
  (typeof EXERCISE_THUMBNAIL_ORIENTATIONS)[number]

export const EXERCISE_THUMBNAIL_ORIENTATION_PRESETS: Record<
  ExerciseThumbnailOrientation,
  { width: string; height: string }
> = {
  landscape: { width: '1280', height: '720' },
  portrait: { width: '270', height: '480' },
}

export const EXERCISE_THUMBNAIL_DEFAULT_FORM: ExerciseThumbnailFormState = {
  timestampSec: '0',
  ...EXERCISE_THUMBNAIL_ORIENTATION_PRESETS.landscape,
  format: 'jpg',
  quality: '92',
}

export function exerciseThumbnailOrientationFor(
  form: Pick<ExerciseThumbnailFormState, 'width' | 'height'>,
): ExerciseThumbnailOrientation | null {
  for (const orientation of EXERCISE_THUMBNAIL_ORIENTATIONS) {
    const preset = EXERCISE_THUMBNAIL_ORIENTATION_PRESETS[orientation]
    if (preset.width === form.width && preset.height === form.height) {
      return orientation
    }
  }
  return null
}

export type ExerciseThumbnailCaptureInput = {
  timestampSec: number
  width: number
  height: number
  format: ExerciseThumbnailFormat
  /** 0..1, ignored for png */
  quality: number
}

export function mimeTypeForExerciseThumbnailFormat(
  format: ExerciseThumbnailFormat,
): string {
  if (format === 'jpg') return 'image/jpeg'
  if (format === 'webp') return 'image/webp'
  return 'image/png'
}

export function extensionForExerciseThumbnailFormat(
  format: ExerciseThumbnailFormat,
): string {
  return format
}

export function formatExerciseThumbnailBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function normalizeExerciseThumbnailQuality(value: string): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 0.92
  return Math.min(100, Math.max(1, parsed)) / 100
}

export function parseExerciseThumbnailForm(
  form: ExerciseThumbnailFormState,
): ExerciseThumbnailCaptureInput {
  const timestampSec = Number(form.timestampSec)
  const width = Number(form.width)
  const height = Number(form.height)

  if (Number.isNaN(timestampSec) || timestampSec < 0) {
    throw new Error(
      'Timestamp must be a number greater than or equal to 0 seconds.',
    )
  }

  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    width < 1 ||
    height < 1 ||
    width > EXERCISE_THUMBNAIL_MAX_DIMENSION ||
    height > EXERCISE_THUMBNAIL_MAX_DIMENSION
  ) {
    throw new Error(
      `Resolution must be between 1x1 and ${EXERCISE_THUMBNAIL_MAX_DIMENSION}x${EXERCISE_THUMBNAIL_MAX_DIMENSION}.`,
    )
  }

  return {
    timestampSec,
    width: Math.round(width),
    height: Math.round(height),
    format: form.format,
    quality: normalizeExerciseThumbnailQuality(form.quality),
  }
}

export type ExerciseThumbnailVideoSource =
  | { kind: 'cdn'; url: string }
  | { kind: 'file'; file: File }

function loadVideoElement(source: ExerciseThumbnailVideoSource): {
  video: HTMLVideoElement
  release: () => void
} {
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true

  if (source.kind === 'cdn') {
    video.src = exerciseThumbnailVideoProxyUrl(source.url)
    return { video, release: () => video.removeAttribute('src') }
  }

  const objectUrl = URL.createObjectURL(source.file)
  video.src = objectUrl
  return {
    video,
    release: () => {
      video.removeAttribute('src')
      URL.revokeObjectURL(objectUrl)
    },
  }
}

function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () =>
      reject(
        new Error(
          'Could not load the video. Check that the file is reachable on the CDN.',
        ),
      )
  })
}

function seekTo(video: HTMLVideoElement, timestampSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve()
    video.onerror = () =>
      reject(
        new Error(
          'Could not seek to that timestamp. Try another timestamp or confirm the video can be decoded.',
        ),
      )
    video.currentTime = timestampSec
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  input: ExerciseThumbnailCaptureInput,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const quality = input.format === 'png' ? undefined : input.quality
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(
            new Error(
              'Could not extract frame. The video could not be decoded for canvas access.',
            ),
          )
          return
        }
        resolve(result)
      },
      mimeTypeForExerciseThumbnailFormat(input.format),
      quality,
    )
  })
}

/**
 * Draw one frame of the video onto a canvas of the requested size and
 * encode it. Mirrors the toolbox generator: the frame is stretched to the
 * requested box, aspect ratio is not preserved.
 */
export async function captureExerciseThumbnail(
  source: ExerciseThumbnailVideoSource,
  input: ExerciseThumbnailCaptureInput,
): Promise<Blob> {
  const { video, release } = loadVideoElement(source)

  try {
    await waitForMetadata(video)

    if (input.timestampSec > video.duration) {
      throw new Error(
        `Timestamp exceeds video duration (${video.duration.toFixed(2)}s).`,
      )
    }

    await seekTo(video, input.timestampSec)

    const canvas = document.createElement('canvas')
    canvas.width = input.width
    canvas.height = input.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas is not available in this browser.')
    }

    context.drawImage(video, 0, 0, input.width, input.height)

    const blob = await canvasToBlob(canvas, input)

    if (blob.size > EXERCISE_THUMBNAIL_MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Thumbnail is ${formatExerciseThumbnailBytes(blob.size)}. Maximum allowed file size is ${formatExerciseThumbnailBytes(EXERCISE_THUMBNAIL_MAX_FILE_SIZE_BYTES)}.`,
      )
    }

    return blob
  } finally {
    release()
  }
}

export function exerciseThumbnailFile(
  blob: Blob,
  format: ExerciseThumbnailFormat,
): File {
  return new File(
    [blob],
    `thumbnail.${extensionForExerciseThumbnailFormat(format)}`,
    { type: mimeTypeForExerciseThumbnailFormat(format) },
  )
}
