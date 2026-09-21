import { formatRecipientsForInput } from '@/lib/admin-email-recipients'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  useAdminEmailDraftRecipients,
  useArchiveAdminEmailDraft,
  useCloneAdminEmailDraft,
  useFinalSendAdminEmailDraft,
  useRestoreAdminEmailDraft,
  useTestSendAdminEmailDraft,
  useUpdateAdminEmailDraft,
} from '@virtality/react-query'
import type { AdminEmailTopic, EmailBodyBlock } from '@virtality/shared/types'
import { useState } from 'react'
import { toast } from 'sonner'
import type { FinalSendBreakdown } from './final-send-dialog'

export type DraftWorkspaceData = {
  id: string
  subject: string
  previewText: string | null
  bodyBlocks: EmailBodyBlock[]
  recipients: string[]
  topic: AdminEmailTopic
  audienceId: string | null
  isFinalSent: boolean
  updatedAt: string | Date
  sendReadiness: {
    ready: boolean
    reasons: string[]
  }
}

export type DraftFormState = {
  subject: string
  previewText: string
  bodyBlocks: EmailBodyBlock[]
  recipientsText: string
  topic: AdminEmailTopic
  audienceId: string | null
}

export const toDraftFormState = (
  draft: DraftWorkspaceData,
): DraftFormState => ({
  subject: draft.subject,
  previewText: draft.previewText ?? '',
  bodyBlocks: draft.bodyBlocks,
  recipientsText: formatRecipientsForInput(draft.recipients),
  topic: draft.topic,
  audienceId: draft.audienceId,
})

type UseAdminEmailDraftActionsInput = {
  draft: DraftWorkspaceData
  form: DraftFormState
  parsedRecipients: string[]
  isDirty: boolean
  onCloned: (draftId: string) => void
  onArchived: () => void
  onRestored: (draftId: string) => void
  onFinalSent: (sentRecordId: string) => void
}

/** Save, clone, archive, restore, test send and final send for one draft. */
export const useAdminEmailDraftActions = ({
  draft,
  form,
  parsedRecipients,
  isDirty,
  onCloned,
  onArchived,
  onRestored,
  onFinalSent,
}: UseAdminEmailDraftActionsInput) => {
  const [finalSendOpen, setFinalSendOpen] = useState(false)
  const [confirmedSubject, setConfirmedSubject] = useState('')
  const [finalSendBreakdown, setFinalSendBreakdown] =
    useState<FinalSendBreakdown | null>(null)

  const updateDraftMutation = useUpdateAdminEmailDraft()
  const cloneDraftMutation = useCloneAdminEmailDraft()
  const archiveDraftMutation = useArchiveAdminEmailDraft()
  const restoreDraftMutation = useRestoreAdminEmailDraft()
  const testSendMutation = useTestSendAdminEmailDraft(draft.id)
  const finalSendMutation = useFinalSendAdminEmailDraft()
  const { refetch: refetchRecipients } = useAdminEmailDraftRecipients(draft.id)

  const saveDraft = async () => {
    try {
      const updated = await updateDraftMutation.mutateAsync({
        draftId: draft.id,
        subject: form.subject,
        previewText: form.previewText.trim() ? form.previewText : null,
        bodyBlocks: form.bodyBlocks,
        recipients: parsedRecipients,
        topic: form.topic,
        audienceId: form.audienceId,
      })
      toast.success('Draft saved')
      return updated
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save draft'))
      return null
    }
  }

  const saveIfDirty = async () =>
    isDirty ? (await saveDraft()) !== null : true

  const testSend = async (testRecipientEmail: string) => {
    if (!(await saveIfDirty())) {
      return false
    }

    try {
      await testSendMutation.mutateAsync({
        draftId: draft.id,
        testRecipientEmail,
      })
      toast.success(`Test email sent to ${testRecipientEmail}`)
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send test email'))
      return false
    }
  }

  /** Save, resolve the live recipient set, then open the confirmation. */
  const openFinalSend = async () => {
    if (!(await saveIfDirty())) {
      return
    }

    setConfirmedSubject('')
    setFinalSendBreakdown(null)
    setFinalSendOpen(true)

    const { data } = await refetchRecipients()
    if (data) {
      setFinalSendBreakdown(data)
    } else {
      toast.error('Failed to resolve recipients')
      setFinalSendOpen(false)
    }
  }

  const finalSend = async () => {
    if (!finalSendBreakdown) {
      return
    }

    try {
      const sentRecord = await finalSendMutation.mutateAsync({
        draftId: draft.id,
        confirmedSubject: form.subject,
        confirmedRecipientCount: finalSendBreakdown.totalCount,
      })
      toast.success('Email sent')
      setFinalSendOpen(false)
      setConfirmedSubject('')
      onFinalSent(sentRecord.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send email'))
    }
  }

  const clone = async () => {
    try {
      const cloned = await cloneDraftMutation.mutateAsync({ draftId: draft.id })
      toast.success('Draft cloned')
      onCloned(cloned.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to clone draft'))
    }
  }

  const archive = async () => {
    try {
      await archiveDraftMutation.mutateAsync({ draftId: draft.id })
      toast.success('Draft archived')
      onArchived()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to archive draft'))
    }
  }

  const restore = async () => {
    try {
      const restored = await restoreDraftMutation.mutateAsync({
        draftId: draft.id,
      })
      toast.success('Draft restored')
      onRestored(restored.id)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to restore draft'))
    }
  }

  return {
    saveDraft,
    testSend,
    openFinalSend,
    finalSend,
    clone,
    archive,
    restore,
    finalSendOpen,
    setFinalSendOpen,
    finalSendBreakdown,
    confirmedSubject,
    setConfirmedSubject,
    isSavePending: updateDraftMutation.isPending,
    isTestSendPending: testSendMutation.isPending,
    isFinalSendPending: finalSendMutation.isPending,
    isClonePending: cloneDraftMutation.isPending,
    isArchivePending: archiveDraftMutation.isPending,
    isRestorePending: restoreDraftMutation.isPending,
  }
}
