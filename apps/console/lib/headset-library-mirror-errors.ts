import type { HeadsetLibraryWriteError } from '@virtality/react-query'

/**
 * Only the physio's own click deserves a toast; the headset-driven writes
 * are repaired by the next full `videoLibraryState` and are logged instead.
 */
export function mirrorWriteErrorMessage(
  error: HeadsetLibraryWriteError,
): string | null {
  if (error.procedure !== 'requestDownload') return null
  if (error.code === 'NOT_FOUND') {
    return 'This headset is not linked to your account; the download request was not saved.'
  }
  if (error.code === 'UNAUTHORIZED') {
    return 'Your session has expired; the download request was not saved.'
  }
  return 'The download request could not be saved.'
}
