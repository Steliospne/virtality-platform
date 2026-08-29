export type DraftArchiveRecord = {
  archivedAt: Date | string | null
}

export const isDraftArchived = (draft: DraftArchiveRecord): boolean =>
  draft.archivedAt != null

export const partitionDraftsByArchiveStatus = <T extends DraftArchiveRecord>(
  drafts: T[],
) => ({
  active: drafts.filter((draft) => !isDraftArchived(draft)),
  archived: drafts.filter((draft) => isDraftArchived(draft)),
})

export const buildArchiveDraftData = (
  archivedById: string,
  archivedAt = new Date(),
) => ({
  archivedAt,
  archivedById,
  restoredAt: null,
  restoredById: null,
})

export const buildRestoreDraftData = (
  restoredById: string,
  restoredAt = new Date(),
) => ({
  archivedAt: null,
  archivedById: null,
  restoredAt,
  restoredById,
  updatedAt: restoredAt,
})
