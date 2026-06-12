export type AdminEmailDraftHeaderMenuItemId = 'preview' | 'clone' | 'archive'

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
  const items: AdminEmailDraftHeaderMenuItem[] = [
    { id: 'preview', label: 'Preview' },
    {
      id: 'clone',
      label: isFinalSent ? 'Clone into new draft' : 'Clone draft',
    },
  ]

  if (!isArchived) {
    items.push({ id: 'archive', label: 'Archive draft' })
  }

  return items
}

export const ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY = {
  title: 'Archive draft?',
  description:
    'This hides the draft from the active list. You can restore it later from Archived drafts.',
  confirmLabel: 'Archive draft',
} as const
