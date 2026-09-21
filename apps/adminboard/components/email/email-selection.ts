import type { DraftWorkspaceData } from './use-admin-email-draft-actions'
import type { DraftWorkspaceCallbacks } from './use-admin-email-draft-workspace'
import type {
  useAdminEmailArchivedDrafts,
  useAdminEmailDrafts,
  useAdminEmailSentRecords,
} from '@virtality/react-query'

export type EmailSelection =
  | { kind: 'draft'; id: string }
  | { kind: 'sent'; id: string }
  | null

export type DraftListRecord = NonNullable<
  ReturnType<typeof useAdminEmailDrafts>['data']
>[number]

export type ArchivedDraftListRecord = NonNullable<
  ReturnType<typeof useAdminEmailArchivedDrafts>['data']
>[number]

export type SentListRecord = NonNullable<
  ReturnType<typeof useAdminEmailSentRecords>['data']
>[number]

/** Lists plus selection, shared by the table and the stepper. */
export type EmailLayoutProps = {
  drafts: DraftListRecord[]
  archivedDrafts: ArchivedDraftListRecord[]
  sentRecords: SentListRecord[]
  selection: EmailSelection
  onSelect: (selection: EmailSelection) => void
  onCreateDraft: () => void
  isCreatingDraft: boolean
  onRestoreDraft: (draftId: string) => void
  isRestoringDraft: boolean
}

export type SelectedDraft = {
  draft: DraftWorkspaceData
  isArchived: boolean
}

export const toDraftWorkspaceData = (
  draft: DraftListRecord | ArchivedDraftListRecord,
): DraftWorkspaceData => ({
  id: draft.id,
  subject: draft.subject,
  previewText: draft.previewText,
  bodyBlocks: draft.bodyBlocks,
  recipients: draft.recipients,
  topic: draft.topic,
  audienceId: draft.audienceId,
  isFinalSent: draft.isFinalSent,
  sendReadiness: draft.sendReadiness,
  updatedAt: draft.updatedAt,
})

/** Selection transitions every layout uses after a draft action. */
export const getDraftWorkspaceCallbacks = (
  onSelect: (selection: EmailSelection) => void,
): DraftWorkspaceCallbacks => ({
  onCloned: (draftId) => onSelect({ kind: 'draft', id: draftId }),
  onArchived: () => onSelect(null),
  onRestored: (draftId) => onSelect({ kind: 'draft', id: draftId }),
  onFinalSent: (sentRecordId) => onSelect({ kind: 'sent', id: sentRecordId }),
})
