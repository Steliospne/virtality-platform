import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY,
  getAdminEmailDraftCloneLabel,
  getAdminEmailDraftHeaderMenuItems,
  getAdminEmailDraftPreviewQueryDraftId,
  getAdminEmailDraftWorkspaceHeader,
  isAdminEmailDraftReadOnly,
  prepareAdminEmailDraftPreview,
  resolveSelectedAdminEmailDraft,
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

describe('getAdminEmailDraftCloneLabel', () => {
  it('uses the editable clone label for drafts that have not been final-sent', () => {
    expect(getAdminEmailDraftCloneLabel(false)).toBe('Clone draft')
  })

  it('uses the final-sent clone label for sent drafts', () => {
    expect(getAdminEmailDraftCloneLabel(true)).toBe('Clone into new draft')
  })
})

describe('getAdminEmailDraftWorkspaceHeader', () => {
  it('describes archived drafts as read-only with restore guidance', () => {
    expect(getAdminEmailDraftWorkspaceHeader({ isArchived: true, isFinalSent: false })).toEqual({
      title: 'Archived draft (read-only)',
      description:
        'Restore this draft to edit it again, or clone it into a new active draft.',
    })
  })

  it('describes final-sent drafts as read-only', () => {
    expect(getAdminEmailDraftWorkspaceHeader({ isArchived: false, isFinalSent: true })).toEqual({
      title: 'Sent draft (read-only)',
      description:
        'Edit the subject and Email Body Blocks. The Email Brand Shell stays locked.',
    })
  })

  it('describes editable active drafts', () => {
    expect(getAdminEmailDraftWorkspaceHeader({ isArchived: false, isFinalSent: false })).toEqual({
      title: 'Edit draft',
      description:
        'Edit the subject and Email Body Blocks. The Email Brand Shell stays locked.',
    })
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

  it('includes restore, preview, and clone for archived drafts', () => {
    expect(getAdminEmailDraftHeaderMenuItems(false, true)).toEqual([
      { id: 'restore', label: 'Restore draft' },
      { id: 'preview', label: 'Preview' },
      { id: 'clone', label: 'Clone draft' },
    ])
  })

  it('uses final-sent clone label for archived final-sent drafts', () => {
    expect(getAdminEmailDraftHeaderMenuItems(true, true)).toEqual([
      { id: 'restore', label: 'Restore draft' },
      { id: 'preview', label: 'Preview' },
      { id: 'clone', label: 'Clone into new draft' },
    ])
  })
})

describe('isAdminEmailDraftReadOnly', () => {
  it('treats archived drafts as read-only', () => {
    expect(isAdminEmailDraftReadOnly({ isArchived: true, isFinalSent: false })).toBe(
      true,
    )
  })

  it('treats final-sent drafts as read-only', () => {
    expect(isAdminEmailDraftReadOnly({ isArchived: false, isFinalSent: true })).toBe(
      true,
    )
  })

  it('allows editing active drafts that are not final-sent', () => {
    expect(isAdminEmailDraftReadOnly({ isArchived: false, isFinalSent: false })).toBe(
      false,
    )
  })
})

describe('resolveSelectedAdminEmailDraft', () => {
  const active = [{ id: 'active-1' }]
  const archived = [{ id: 'archived-1' }]

  it('resolves an active draft selection', () => {
    expect(
      resolveSelectedAdminEmailDraft({
        selectionId: 'active-1',
        activeDrafts: active,
        archivedDrafts: archived,
      }),
    ).toEqual({ draft: active[0], isArchived: false })
  })

  it('resolves an archived draft selection', () => {
    expect(
      resolveSelectedAdminEmailDraft({
        selectionId: 'archived-1',
        activeDrafts: active,
        archivedDrafts: archived,
      }),
    ).toEqual({ draft: archived[0], isArchived: true })
  })

  it('returns undefined when the draft is not found', () => {
    expect(
      resolveSelectedAdminEmailDraft({
        selectionId: 'missing',
        activeDrafts: active,
        archivedDrafts: archived,
      }),
    ).toEqual({ draft: undefined, isArchived: false })
  })
})

describe('ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY', () => {
  it('explains that archived drafts can be restored', () => {
    expect(ADMIN_EMAIL_DRAFT_ARCHIVE_DIALOG_COPY.description).toContain('restore')
  })
})
