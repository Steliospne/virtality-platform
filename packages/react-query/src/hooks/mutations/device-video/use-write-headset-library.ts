import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

/**
 * The four Library Mirror writes the console makes from a headset's socket
 * events (ADR 0013). Each invalidates the offline list so other views of the
 * same headset catch up without a reconnect.
 */
export function useWriteHeadsetLibrary() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.deviceVideo.listForUser.key(),
    })

  const reportLibraryState = useMutation(
    orpc.deviceVideo.reportLibraryState.mutationOptions({ onSuccess }),
  )
  const requestDownload = useMutation(
    orpc.deviceVideo.requestDownload.mutationOptions({ onSuccess }),
  )
  const applyEvent = useMutation(
    orpc.deviceVideo.applyEvent.mutationOptions({ onSuccess }),
  )
  const remove = useMutation(
    orpc.deviceVideo.remove.mutationOptions({ onSuccess }),
  )

  return { reportLibraryState, requestDownload, applyEvent, remove }
}
