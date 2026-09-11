import {
  EXERCISE_THUMBNAIL_DEFAULT_FORM,
  EXERCISE_THUMBNAIL_ORIENTATION_PRESETS,
  captureExerciseThumbnail,
  formatExerciseThumbnailBytes,
  parseExerciseThumbnailForm,
  type ExerciseThumbnailFormState,
  type ExerciseThumbnailOrientation,
  type ExerciseThumbnailVideoSource,
} from '@/lib/exercise-wizard-thumbnail'
import { getErrorMessage } from '@/lib/get-error-message'
import { useCallback, useEffect, useState } from 'react'

type GeneratedThumbnail = {
  blob: Blob
  previewUrl: string
}

export function useExerciseThumbnailGenerator(
  source: ExerciseThumbnailVideoSource | null,
) {
  const [form, setForm] = useState<ExerciseThumbnailFormState>(
    EXERCISE_THUMBNAIL_DEFAULT_FORM,
  )
  const [generated, setGenerated] = useState<GeneratedThumbnail | null>(null)
  const [status, setStatus] = useState('Ready')
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const sourceKey = source
    ? source.kind === 'cdn'
      ? source.url
      : source.file
    : null

  // Discard the preview whenever the video source changes.
  useEffect(() => {
    setGenerated(null)
    setError(null)
    setStatus('Ready')
  }, [sourceKey])

  // Revoke the object URL when the preview is replaced or unmounted.
  useEffect(() => {
    if (!generated) return
    return () => URL.revokeObjectURL(generated.previewUrl)
  }, [generated])

  const updateField = useCallback(
    <K extends keyof ExerciseThumbnailFormState>(
      field: K,
      value: ExerciseThumbnailFormState[K],
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const applyOrientation = useCallback(
    (orientation: ExerciseThumbnailOrientation) => {
      setForm((prev) => ({
        ...prev,
        ...EXERCISE_THUMBNAIL_ORIENTATION_PRESETS[orientation],
      }))
    },
    [],
  )

  const generate = useCallback(async () => {
    if (!source) {
      setError('Pick or select a video first.')
      return
    }

    setError(null)
    setStatus('Generating thumbnail...')
    setIsBusy(true)

    try {
      const input = parseExerciseThumbnailForm(form)
      const blob = await captureExerciseThumbnail(source, input)
      setGenerated({ blob, previewUrl: URL.createObjectURL(blob) })
      setStatus(`Thumbnail ready (${formatExerciseThumbnailBytes(blob.size)}).`)
    } catch (generationError) {
      setError(
        getErrorMessage(
          generationError,
          'Unexpected error during thumbnail generation.',
        ),
      )
      setGenerated(null)
      setStatus('Generation failed')
    } finally {
      setIsBusy(false)
    }
  }, [form, source])

  const clear = useCallback(() => {
    setGenerated(null)
    setStatus('Ready')
  }, [])

  return {
    form,
    updateField,
    applyOrientation,
    generated,
    status,
    error,
    isBusy,
    generate,
    clear,
  }
}
