import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export type HeadsetLibraryWriteProcedure =
  | 'reportLibraryState'
  | 'requestDownload'
  | 'applyEvent'
  | 'remove'

export type HeadsetLibraryWriteError = {
  procedure: HeadsetLibraryWriteProcedure
  deviceId: string
  videoId: string | null
  /** oRPC error code (`NOT_FOUND`, `UNAUTHORIZED`, …) when the API answered. */
  code: string | null
  status: number | null
  message: string
}

export type UseWriteHeadsetLibraryOptions = {
  /** Called after the default `console.error`; use it to surface a toast. */
  onError?: (error: HeadsetLibraryWriteError) => void
}

function describeWriteError(
  procedure: HeadsetLibraryWriteProcedure,
  error: unknown,
  variables: { deviceId: string; videoId?: string },
): HeadsetLibraryWriteError {
  const record =
    error != null && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : {}
  return {
    procedure,
    deviceId: variables.deviceId,
    videoId: variables.videoId ?? null,
    code: typeof record.code === 'string' ? record.code : null,
    status: typeof record.status === 'number' ? record.status : null,
    message: error instanceof Error ? error.message : String(error),
  }
}

/**
 * The four Library Mirror writes the console makes from a headset's socket
 * events (ADR 0009). Each invalidates the offline list so other views of the
 * same headset catch up without a reconnect.
 *
 * The writes are fire-and-forget for the caller, so a rejected write is
 * reported here: always to the browser console, and to `onError` when given.
 */
export function useWriteHeadsetLibrary(
  options?: UseWriteHeadsetLibraryOptions,
) {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.deviceVideo.listForUser.key(),
    })
  const reportError =
    (procedure: HeadsetLibraryWriteProcedure) =>
    (error: unknown, variables: { deviceId: string; videoId?: string }) => {
      const described = describeWriteError(procedure, error, variables)
      console.error('headset library mirror write failed', described)
      options?.onError?.(described)
    }

  const reportLibraryState = useMutation(
    orpc.deviceVideo.reportLibraryState.mutationOptions({
      onSuccess,
      onError: reportError('reportLibraryState'),
    }),
  )
  const requestDownload = useMutation(
    orpc.deviceVideo.requestDownload.mutationOptions({
      onSuccess,
      onError: reportError('requestDownload'),
    }),
  )
  const applyEvent = useMutation(
    orpc.deviceVideo.applyEvent.mutationOptions({
      onSuccess,
      onError: reportError('applyEvent'),
    }),
  )
  const remove = useMutation(
    orpc.deviceVideo.remove.mutationOptions({
      onSuccess,
      onError: reportError('remove'),
    }),
  )

  return { reportLibraryState, requestDownload, applyEvent, remove }
}
