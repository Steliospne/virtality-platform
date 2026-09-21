'use client'

import { getErrorMessage } from '@/lib/get-error-message'
import {
  useAdminEmailArchivedDrafts,
  useAdminEmailDrafts,
  useAdminEmailSentRecords,
  useCreateAdminEmailDraft,
  useRestoreAdminEmailDraft,
} from '@virtality/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { DraftStepper } from './draft-stepper'
import { EmailEmptyState } from './email-empty-state'
import {
  getDraftWorkspaceCallbacks,
  type EmailLayoutProps,
  type EmailSelection,
} from './email-selection'
import { EmailTable } from './email-table'
import { SentRecordPage } from './sent-record-page'
import { useSelectedDraft } from './use-selected-draft'

/**
 * One table of every admin-authored email; a draft opens as
 * Compose → Target → Review & send, a sent record as its audit view.
 */
export const AdminAuthoredEmailsPanel = () => {
  const [selection, setSelection] = useState<EmailSelection>(null)
  const { data: drafts, isLoading: draftsLoading } = useAdminEmailDrafts()
  const { data: archivedDrafts, isLoading: archivedDraftsLoading } =
    useAdminEmailArchivedDrafts()
  const { data: sentRecords, isLoading: sentLoading } =
    useAdminEmailSentRecords()
  const createDraftMutation = useCreateAdminEmailDraft()
  const restoreDraftMutation = useRestoreAdminEmailDraft()

  const lists: EmailLayoutProps = {
    drafts: drafts ?? [],
    archivedDrafts: archivedDrafts ?? [],
    sentRecords: sentRecords ?? [],
    selection,
    onSelect: setSelection,
    onCreateDraft: () => void handleCreateDraft(),
    isCreatingDraft: createDraftMutation.isPending,
    onRestoreDraft: (draftId) => void handleRestoreDraft(draftId),
    isRestoringDraft: restoreDraftMutation.isPending,
  }
  const selected = useSelectedDraft(lists)

  const handleCreateDraft = async () => {
    try {
      const draft = await createDraftMutation.mutateAsync(undefined)
      setSelection({ kind: 'draft', id: draft.id })
      toast.success('Draft created')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create draft'))
    }
  }

  const handleRestoreDraft = async (draftId: string) => {
    try {
      const restored = await restoreDraftMutation.mutateAsync({ draftId })
      setSelection({ kind: 'draft', id: restored.id })
      toast.success('Draft restored')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to restore draft'))
    }
  }

  if (draftsLoading || archivedDraftsLoading || sentLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>
          Loading admin-authored emails...
        </p>
      </div>
    )
  }

  if (!selection) {
    return <EmailTable {...lists} />
  }

  if (selection.kind === 'sent') {
    return (
      <SentRecordPage sentRecordId={selection.id} onSelect={setSelection} />
    )
  }

  if (!selected) {
    return <EmailEmptyState message='Draft not found.' />
  }

  return (
    <DraftStepper
      key={selected.draft.id}
      draft={selected.draft}
      isArchived={selected.isArchived}
      onBack={() => setSelection(null)}
      {...getDraftWorkspaceCallbacks(setSelection)}
    />
  )
}
