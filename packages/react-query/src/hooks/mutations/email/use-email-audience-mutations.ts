import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

const useInvalidateEmailAudiences = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: orpc.email.audiences.list.key(),
    })
    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.drafts.resolveRecipients.key(),
    })
    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.drafts.previewRecipients.key(),
    })
  }
}

export const useCreateEmailAudience = () => {
  const orpc = useORPC()
  const invalidate = useInvalidateEmailAudiences()

  return useMutation(
    orpc.email.audiences.create.mutationOptions({
      onSuccess: () => invalidate(),
    }),
  )
}

export const useUpdateEmailAudience = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateEmailAudiences()

  return useMutation(
    orpc.email.audiences.update.mutationOptions({
      onSuccess: (audience) => {
        invalidate()
        queryClient.invalidateQueries({
          queryKey: orpc.email.audiences.get.key({
            input: { audienceId: audience.id },
          }),
        })
      },
    }),
  )
}

export const useDeleteEmailAudience = () => {
  const orpc = useORPC()
  const invalidate = useInvalidateEmailAudiences()

  return useMutation(
    orpc.email.audiences.delete.mutationOptions({
      onSuccess: () => invalidate(),
    }),
  )
}

export const usePreviewEmailAudience = () => {
  const orpc = useORPC()
  return useMutation(orpc.email.audiences.preview.mutationOptions())
}

export const usePreviewEmailAudienceMembers = () => {
  const orpc = useORPC()
  return useMutation(orpc.email.audiences.previewMembers.mutationOptions())
}

export const useRecordEmailOptOut = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.email.optOuts.record.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.email.optOuts.list.key(),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.email.adminAuthored.drafts.resolveRecipients.key(),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.email.adminAuthored.drafts.previewRecipients.key(),
        })
      },
    }),
  )
}

/** Public: the recipient confirms the opt-out from the website page. */
export const useConfirmEmailOptOut = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.email.optOuts.confirm.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.email.optOuts.inspect.key(),
        })
      },
    }),
  )
}
