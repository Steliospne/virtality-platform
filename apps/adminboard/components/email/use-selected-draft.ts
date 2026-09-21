import { resolveSelectedAdminEmailDraft } from '@/lib/admin-email-draft-actions'
import {
  toDraftWorkspaceData,
  type EmailLayoutProps,
  type SelectedDraft,
} from './email-selection'

/** The draft the selection points at (active or archived), as workspace data. */
export const useSelectedDraft = ({
  selection,
  drafts,
  archivedDrafts,
}: Pick<
  EmailLayoutProps,
  'selection' | 'drafts' | 'archivedDrafts'
>): SelectedDraft | null => {
  if (selection?.kind !== 'draft') {
    return null
  }

  const { draft, isArchived } = resolveSelectedAdminEmailDraft({
    selectionId: selection.id,
    activeDrafts: drafts,
    archivedDrafts,
  })

  return draft ? { draft: toDraftWorkspaceData(draft), isArchived } : null
}
