import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

const useInvalidateAdminEmailDrafts = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.drafts.list.key(),
    })
  }
}

const useInvalidateAdminEmailDraft = (draftId: string | undefined) => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return () => {
    if (!draftId) {
      return
    }

    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.drafts.get.key({
        input: { draftId },
      }),
    })
    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.drafts.preview.key({
        input: { draftId },
      }),
    })
  }
}

const useInvalidateAdminEmailSentRecords = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: orpc.email.adminAuthored.sentRecords.list.key(),
    })
  }
}

export const useCreateAdminEmailDraft = () => {
  const orpc = useORPC()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()

  return useMutation(
    orpc.email.adminAuthored.drafts.create.mutationOptions({
      onSuccess: () => invalidateDrafts(),
    }),
  )
}

export const useUpdateAdminEmailDraft = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()

  return useMutation(
    orpc.email.adminAuthored.drafts.update.mutationOptions({
      onSuccess: (draft) => {
        invalidateDrafts()
        queryClient.invalidateQueries({
          queryKey: orpc.email.adminAuthored.drafts.get.key({
            input: { draftId: draft.id },
          }),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.email.adminAuthored.drafts.preview.key({
            input: { draftId: draft.id },
          }),
        })
      },
    }),
  )
}

export const useCloneAdminEmailDraft = () => {
  const orpc = useORPC()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()

  return useMutation(
    orpc.email.adminAuthored.drafts.clone.mutationOptions({
      onSuccess: () => invalidateDrafts(),
    }),
  )
}

export const useCloneAdminEmailFromSent = () => {
  const orpc = useORPC()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()

  return useMutation(
    orpc.email.adminAuthored.drafts.cloneFromSent.mutationOptions({
      onSuccess: () => invalidateDrafts(),
    }),
  )
}

export const useTestSendAdminEmailDraft = (draftId: string | undefined) => {
  const orpc = useORPC()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()
  const invalidateDraft = useInvalidateAdminEmailDraft(draftId)

  return useMutation(
    orpc.email.adminAuthored.drafts.testSend.mutationOptions({
      onSuccess: () => {
        invalidateDrafts()
        invalidateDraft()
      },
    }),
  )
}

export const useFinalSendAdminEmailDraft = () => {
  const orpc = useORPC()
  const invalidateDrafts = useInvalidateAdminEmailDrafts()
  const invalidateSentRecords = useInvalidateAdminEmailSentRecords()

  return useMutation(
    orpc.email.adminAuthored.drafts.finalSend.mutationOptions({
      onSuccess: () => {
        invalidateDrafts()
        invalidateSentRecords()
      },
    }),
  )
}
