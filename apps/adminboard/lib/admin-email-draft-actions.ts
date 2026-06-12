export type AdminEmailDraftHeaderMenuItemId = 'preview' | 'clone'

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
): AdminEmailDraftHeaderMenuItem[] {
  return [
    { id: 'preview', label: 'Preview' },
    {
      id: 'clone',
      label: isFinalSent ? 'Clone into new draft' : 'Clone draft',
    },
  ]
}
