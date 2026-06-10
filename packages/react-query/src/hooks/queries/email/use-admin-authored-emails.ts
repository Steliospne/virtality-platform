import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export const useAdminEmailDrafts = () => {
  const orpc = useORPC()
  return useQuery(orpc.email.adminAuthored.drafts.list.queryOptions())
}

export const useAdminEmailDraft = (draftId: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.adminAuthored.drafts.get.queryOptions({
      input: draftId ? { draftId } : skipToken,
    }),
  )
}

export const useAdminEmailDraftPreview = (draftId: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.adminAuthored.drafts.preview.queryOptions({
      input: draftId ? { draftId } : skipToken,
    }),
  )
}

export const useAdminEmailSentRecords = () => {
  const orpc = useORPC()
  return useQuery(orpc.email.adminAuthored.sentRecords.list.queryOptions())
}

export const useAdminEmailSentRecord = (sentRecordId: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.adminAuthored.sentRecords.get.queryOptions({
      input: sentRecordId ? { sentRecordId } : skipToken,
    }),
  )
}
