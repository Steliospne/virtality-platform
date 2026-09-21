'use client'

import { getAdminEmailTopicLabel } from '@virtality/shared/utils'
import { AdminEmailDraftArchiveDialog } from './admin-email-draft-archive-dialog'
import { AdminEmailDraftPreviewDialog } from './admin-email-draft-preview-dialog'
import { FinalSendDialog } from './final-send-dialog'
import type { AdminEmailDraftWorkspaceState } from './use-admin-email-draft-workspace'

type AdminEmailDraftDialogsProps = {
  workspace: AdminEmailDraftWorkspaceState
}

/** Preview, archive and final-send dialogs for one draft workspace. */
export const AdminEmailDraftDialogs = ({
  workspace,
}: AdminEmailDraftDialogsProps) => {
  const { form, actions, preview, archive } = workspace

  return (
    <>
      <AdminEmailDraftPreviewDialog
        open={preview.open}
        onOpenChange={preview.setOpen}
        subject={preview.data?.subject ?? form.subject}
        html={preview.data?.html}
        isLoading={preview.isFetching}
      />

      <AdminEmailDraftArchiveDialog
        open={archive.open}
        onOpenChange={archive.setOpen}
        onConfirm={() =>
          void actions.archive().then(() => archive.setOpen(false))
        }
        isPending={actions.isArchivePending}
      />

      <FinalSendDialog
        open={actions.finalSendOpen}
        onOpenChange={actions.setFinalSendOpen}
        subject={form.subject}
        topicLabel={getAdminEmailTopicLabel(form.topic)}
        breakdown={actions.finalSendBreakdown}
        confirmedSubject={actions.confirmedSubject}
        onConfirmedSubjectChange={actions.setConfirmedSubject}
        onConfirm={() => void actions.finalSend()}
        isPending={actions.isFinalSendPending}
      />
    </>
  )
}
