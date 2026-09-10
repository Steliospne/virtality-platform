import { getBucketFilenameParts } from '@virtality/shared/utils'

export const EXERCISE_WIZARD_IMAGE_UPLOAD_PREFIX = 'exercises/thumbnail/'
export const EXERCISE_WIZARD_VIDEO_UPLOAD_PREFIX = 'exercises/'

export function buildExerciseDraftMediaUploadFilename(
  displayName: string,
  originalFilename: string,
): string {
  const { extension } = getBucketFilenameParts(originalFilename)
  const stem = displayName.trim()
  if (!extension) {
    return stem
  }

  return `${stem}.${extension}`
}

export function renameFileForExerciseDraftUpload(
  file: File,
  displayName: string,
): File {
  const uploadName = buildExerciseDraftMediaUploadFilename(
    displayName,
    file.name,
  )
  if (uploadName === file.name) {
    return file
  }

  return new File([file], uploadName, { type: file.type })
}
