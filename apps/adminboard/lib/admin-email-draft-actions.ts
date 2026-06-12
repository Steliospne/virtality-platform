export type AdminEmailDraftHeaderMenuItemId =
  | 'preview'
  | 'clone'
  | 'archive'
  | 'restore'

export function isAdminEmailDraftReadOnly({
  isArchived,
  isFinalSent,
}: {
  isArchived: boolean
  isFinalSent: boolean
}): boolean {
  return isArchived || isFinalSent
}

export function resolveSelectedAdminEmailDraft<T extends { id: string }>({
  selectionId,
  activeDrafts,
  archivedDrafts,
}: {
  selectionId: string | undefined
  activeDrafts: T[] | undefined
  archivedDrafts: T[] | undefined
}): { draft: T | undefined; isArchived: boolean } {
  if (!selectionId) {
    return { draft: undefined, isArchived: false }
  }

  const active = activeDrafts?.find((draft) => draft.id === selectionId)
  if (active) {
    return { draft: active, isArchived: false }
  }

  const archived = archivedDrafts?.find((draft) => draft.id === selectionId)
  if (archived) {
    return { draft: archived, isArchived: true }
  }

  return { draft: undefined, isArchived: false }
}

export type AdminEmailDraftHeaderMenuItem = {
  id: AdminEmailDraftHeaderMenuItemId
  label: string
}

export function getAdminEmailDraftPreviewQueryDraftId({
  previewOpen,
  isDirty,
  draftId,
}: {
  previewOpen: boolean
  isDirty: boolean
  draftId: string
}): string | null {
  return previewOpen && !isDirty ? draftId : null
}

export async function prepareAdminEmailDraftPreview({
  isDirty,
  saveDraft,
}: {
  isDirty: boolean
  saveDraft: () => Promise<unknown | null>
}): Promise<boolean> {
  if (!isDirty) {
    return true
  }

  const saved = await saveDraft()
  return saved !== null
}

export function getAdminEmailDraftHeaderMenuItems(
  isFinalSent: boolean,
  isArchived = false,
): AdminEmailDraftHeaderMenuItem[] {
  if (isArchived) {
    return [
      { id: 'restore', label: 'Restore draft' },
      { id: 'preview', label: 'Preview' },
      {
        id: 'clone',
        label: isFinalSent ? 'Clone into new draft' : 'Clone draft',
      },
    ]
  }

  return [
    { id: 'preview', label: 'Preview' },
    {
      id: 'clone',
      label: isFinalSent ? 'Clone into new draft' : 'Clone draft',
    },
    { id: 'archive', label: 'Archive draft' },
  ]
}

export const ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY = {
  title: 'Archive draft?',
  description:
    'This hides the draft from the active list. You can restore it later from Archived drafts.',
  confirmLabel: 'Archive draft',
} as const
