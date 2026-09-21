import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export const useEmailAudiences = () => {
  const orpc = useORPC()
  return useQuery(orpc.email.audiences.list.queryOptions())
}

export const useEmailAudience = (audienceId: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.audiences.get.queryOptions({
      input: audienceId ? { audienceId } : skipToken,
    }),
  )
}

export const useEmailOptOuts = () => {
  const orpc = useORPC()
  return useQuery(orpc.email.optOuts.list.queryOptions())
}

export const useAdminEmailTopics = () => {
  const orpc = useORPC()
  return useQuery(orpc.email.optOuts.topics.queryOptions())
}

export const useAdminEmailDraftRecipients = (draftId: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.adminAuthored.drafts.resolveRecipients.queryOptions({
      input: draftId ? { draftId } : skipToken,
    }),
  )
}

export type AdminEmailTargetingPreviewInput = {
  topic: 'product_updates' | 'newsletter' | 'promotions'
  audienceId: string | null
  recipients: string[]
}

/** Live resolution of unsaved targeting; the workspace debounces the input. */
export const useAdminEmailTargetingPreview = (
  input: AdminEmailTargetingPreviewInput | null,
) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.adminAuthored.drafts.previewRecipients.queryOptions({
      input: input ?? skipToken,
      placeholderData: (previous) => previous,
    }),
  )
}

/** Public: what an opt-out link points at. Used by the website page. */
export const useEmailOptOutLink = (token: string | null) => {
  const orpc = useORPC()
  return useQuery(
    orpc.email.optOuts.inspect.queryOptions({
      input: token ? { token } : skipToken,
      retry: false,
    }),
  )
}
