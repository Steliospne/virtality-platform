import { parseRecipientsFromInput } from '@/lib/admin-email-recipients'
import {
  getAdminEmailDraftPreviewQueryDraftId,
  isAdminEmailDraftReadOnly,
  prepareAdminEmailDraftPreview,
} from '@/lib/admin-email-draft-actions'
import { useAdminEmailDraftPreview } from '@virtality/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  toDraftFormState,
  useAdminEmailDraftActions,
  type DraftFormState,
  type DraftWorkspaceData,
} from './use-admin-email-draft-actions'

export type DraftWorkspaceCallbacks = {
  onCloned: (draftId: string) => void
  onArchived: () => void
  onRestored: (draftId: string) => void
  onFinalSent: (sentRecordId: string) => void
}

type UseAdminEmailDraftWorkspaceInput = DraftWorkspaceCallbacks & {
  draft: DraftWorkspaceData
  isArchived: boolean
}

/**
 * Form state, dirty tracking, preview/archive dialog state and every draft
 * action for one draft — shared by all composer layouts so they only differ
 * in how they arrange the same pieces.
 */
export const useAdminEmailDraftWorkspace = ({
  draft,
  isArchived,
  ...callbacks
}: UseAdminEmailDraftWorkspaceInput) => {
  const [form, setForm] = useState(() => toDraftFormState(draft))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const parsedRecipients = useMemo(
    () => parseRecipientsFromInput(form.recipientsText),
    [form.recipientsText],
  )

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(toDraftFormState(draft)),
    [draft, form],
  )

  const actions = useAdminEmailDraftActions({
    draft,
    form,
    parsedRecipients,
    isDirty,
    ...callbacks,
  })

  useEffect(() => {
    setForm(toDraftFormState(draft))
    setPreviewOpen(false)
    setArchiveOpen(false)
  }, [draft.id, draft.updatedAt])

  const previewQueryDraftId = getAdminEmailDraftPreviewQueryDraftId({
    previewOpen,
    isDirty,
    draftId: draft.id,
  })

  const {
    data: preview,
    refetch: refetchPreview,
    isFetching: isPreviewFetching,
  } = useAdminEmailDraftPreview(previewQueryDraftId)

  const openPreview = async () => {
    const canPreview = await prepareAdminEmailDraftPreview({
      isDirty,
      saveDraft: actions.saveDraft,
    })
    if (!canPreview) {
      return
    }

    setPreviewOpen(true)
    void refetchPreview()
  }

  const patch = (update: Partial<DraftFormState>) =>
    setForm((current) => ({ ...current, ...update }))

  const readOnly = isAdminEmailDraftReadOnly({
    isArchived,
    isFinalSent: draft.isFinalSent,
  })

  return {
    draft,
    isArchived,
    form,
    patch,
    parsedRecipients,
    isDirty,
    readOnly,
    actions,
    preview: {
      open: previewOpen,
      setOpen: setPreviewOpen,
      data: preview,
      isFetching: isPreviewFetching,
      openPreview,
    },
    archive: { open: archiveOpen, setOpen: setArchiveOpen },
  }
}

export type AdminEmailDraftWorkspaceState = ReturnType<
  typeof useAdminEmailDraftWorkspace
>
