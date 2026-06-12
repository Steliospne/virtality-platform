import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY,
  getAdminEmailDraftHeaderMenuItems,
  getAdminEmailDraftPreviewQueryDraftId,
  prepareAdminEmailDraftPreview,
} from './admin-email-draft-actions'

describe('getAdminEmailDraftPreviewQueryDraftId', () => {
  it('returns null while preview is closed', () => {
    expect(
      getAdminEmailDraftPreviewQueryDraftId({
        previewOpen: false,
        isDirty: false,
        draftId: 'draft-1',
      }),
    ).toBeNull()
  })

  it('returns null while preview is open but the draft has unsaved edits', () => {
    expect(
      getAdminEmailDraftPreviewQueryDraftId({
        previewOpen: true,
        isDirty: true,
        draftId: 'draft-1',
      }),
    ).toBeNull()
  })

  it('returns the draft id when preview is open and edits are saved', () => {
    expect(
      getAdminEmailDraftPreviewQueryDraftId({
        previewOpen: true,
        isDirty: false,
        draftId: 'draft-1',
      }),
    ).toBe('draft-1')
  })
})

describe('prepareAdminEmailDraftPreview', () => {
  it('skips saving when the draft is already clean', async () => {
    const saveDraft = vi.fn()

    await expect(
      prepareAdminEmailDraftPreview({ isDirty: false, saveDraft }),
    ).resolves.toBe(true)

    expect(saveDraft).not.toHaveBeenCalled()
  })

  it('saves dirty edits before preview can proceed', async () => {
    const saveDraft = vi.fn().mockResolvedValue({ id: 'draft-1' })

    await expect(
      prepareAdminEmailDraftPreview({ isDirty: true, saveDraft }),
    ).resolves.toBe(true)

    expect(saveDraft).toHaveBeenCalledOnce()
  })

  it('blocks preview when saving dirty edits fails', async () => {
    const saveDraft = vi.fn().mockResolvedValue(null)

    await expect(
      prepareAdminEmailDraftPreview({ isDirty: true, saveDraft }),
    ).resolves.toBe(false)
  })
})

describe('getAdminEmailDraftHeaderMenuItems', () => {
  it('includes preview, clone, and archive actions for editable drafts', () => {
    expect(getAdminEmailDraftHeaderMenuItems(false)).toEqual([
      { id: 'preview', label: 'Preview' },
      { id: 'clone', label: 'Clone draft' },
      { id: 'archive', label: 'Archive draft' },
    ])
  })

  it('includes preview, clone, and archive actions for final-sent read-only drafts', () => {
    expect(getAdminEmailDraftHeaderMenuItems(true)).toEqual([
      { id: 'preview', label: 'Preview' },
      { id: 'clone', label: 'Clone into new draft' },
      { id: 'archive', label: 'Archive draft' },
    ])
  })

  it('omits archive for archived drafts', () => {
    expect(getAdminEmailDraftHeaderMenuItems(false, true)).toEqual([
      { id: 'preview', label: 'Preview' },
      { id: 'clone', label: 'Clone draft' },
    ])
  })
})

describe('ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY', () => {
  it('explains that archived drafts can be restored', () => {
    expect(ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY.description).toContain('restore')
  })
})
