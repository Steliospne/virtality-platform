'use client'

import { Badge } from '@virtality/ui/components/badge'
import { AdminEmailWorkflowBadge } from './admin-email-workflow-badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Button } from '@/components/ui/button'
import { Input } from '@virtality/ui/components/input'
import { parseRecipientsFromInput } from '@/lib/admin-email-recipients'
import { cn } from '@/lib/utils'
import {
  getAdminEmailDraftPreviewQueryDraftId,
  getAdminEmailDraftWorkspaceHeader,
  isAdminEmailDraftReadOnly,
  prepareAdminEmailDraftPreview,
} from '@/lib/admin-email-draft-actions'
import { getAdminEmailTopicLabel } from '@virtality/shared/utils'
import { useAdminEmailDraftPreview } from '@virtality/react-query'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminEmailDraftArchiveDialog } from './admin-email-draft-archive-dialog'
import { AdminEmailDraftHeaderMenu } from './admin-email-draft-header-menu'
import { AdminEmailDraftPreviewDialog } from './admin-email-draft-preview-dialog'
import { AdminEmailDraftTargetingCard } from './admin-email-draft-targeting-card'
import { AdminEmailFinalSendCard } from './admin-email-final-send-card'
import { AdminEmailTestSendCard } from './admin-email-test-send-card'
import { EmailBlockBuilder } from './email-block-builder'
import { FinalSendDialog } from './final-send-dialog'
import { Label } from '@virtality/ui/components/label'
import {
  toDraftFormState,
  useAdminEmailDraftActions,
  type DraftWorkspaceData,
} from './use-admin-email-draft-actions'

type AdminEmailDraftWorkspaceProps = {
  draft: DraftWorkspaceData
  isArchived?: boolean
  onCloned: (draftId: string) => void
  onArchived: () => void
  onRestored: (draftId: string) => void
  onFinalSent: (sentRecordId: string) => void
}

export const AdminEmailDraftWorkspace = ({
  draft,
  isArchived = false,
  onCloned,
  onArchived,
  onRestored,
  onFinalSent,
}: AdminEmailDraftWorkspaceProps) => {
  const [form, setForm] = useState(() => toDraftFormState(draft))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const parsedRecipients = useMemo(
    () => parseRecipientsFromInput(form.recipientsText),
    [form.recipientsText],
  )

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(toDraftFormState(draft)),
    [draft, form],
  )

  const actions = useAdminEmailDraftActions({
    draft,
    form,
    parsedRecipients,
    isDirty,
    onCloned,
    onArchived,
    onRestored,
    onFinalSent,
  })

  useEffect(() => {
    setForm(toDraftFormState(draft))
    setPreviewOpen(false)
    setArchiveOpen(false)
  }, [draft.id, draft.updatedAt])

  const previewQueryDraftId = getAdminEmailDraftPreviewQueryDraftId({
    previewOpen,
    isDirty,
    draftId: draft.id,
  })

  const {
    data: preview,
    refetch: refetchPreview,
    isFetching: isPreviewFetching,
  } = useAdminEmailDraftPreview(previewQueryDraftId)

  const handlePreview = async () => {
    const canPreview = await prepareAdminEmailDraftPreview({
      isDirty,
      saveDraft: actions.saveDraft,
    })
    if (!canPreview) {
      return
    }

    setPreviewOpen(true)
    void refetchPreview()
  }

  const readOnly = isAdminEmailDraftReadOnly({
    isArchived,
    isFinalSent: draft.isFinalSent,
  })
  const workspaceHeader = getAdminEmailDraftWorkspaceHeader({
    isArchived,
    isFinalSent: draft.isFinalSent,
  })

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-col items-start gap-3'>
            <div className='flex w-full flex-wrap items-center justify-between gap-2'>
              <div>
                <CardTitle>{workspaceHeader.title}</CardTitle>
                <CardDescription>{workspaceHeader.description}</CardDescription>
              </div>
              <AdminEmailDraftHeaderMenu
                isFinalSent={draft.isFinalSent}
                isArchived={isArchived}
                onPreview={() => void handlePreview()}
                onClone={() => void actions.clone()}
                onArchive={() => setArchiveOpen(true)}
                onRestore={() => void actions.restore()}
                isClonePending={actions.isClonePending}
                isRestorePending={actions.isRestorePending}
              />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {isArchived ? <Badge variant='outline'>Archived</Badge> : null}
              <Badge variant='secondary'>
                {getAdminEmailTopicLabel(form.topic)}
              </Badge>
              <AdminEmailWorkflowBadge
                kind='send-readiness'
                ready={draft.sendReadiness.ready}
              />
              <Badge
                variant='outline'
                className={cn(
                  'min-w-34',
                  !isDirty && 'pointer-events-none invisible',
                )}
              >
                Unsaved changes
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Subject
            </Label>
            <Input
              className='mt-1'
              value={form.subject}
              disabled={readOnly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder='Email subject'
            />
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Preview text (optional)
            </Label>
            <Input
              className='mt-1'
              value={form.previewText}
              disabled={readOnly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  previewText: event.target.value,
                }))
              }
              placeholder='Inbox preview snippet'
            />
          </div>

          <EmailBlockBuilder
            blocks={form.bodyBlocks}
            disabled={readOnly}
            onChange={(bodyBlocks) =>
              setForm((current) => ({ ...current, bodyBlocks }))
            }
          />

          {!readOnly ? (
            <Button
              type='button'
              onClick={() => void actions.saveDraft()}
              disabled={!isDirty || actions.isSavePending}
            >
              <Save className='mr-2 size-4' />
              {actions.isSavePending ? 'Saving...' : 'Save draft'}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <AdminEmailDraftTargetingCard
        value={{
          topic: form.topic,
          audienceId: form.audienceId,
          recipientsText: form.recipientsText,
        }}
        parsedRecipients={parsedRecipients}
        disabled={readOnly}
        onChange={(update) => setForm((current) => ({ ...current, ...update }))}
      />

      {!readOnly ? (
        <>
          <AdminEmailTestSendCard
            isPending={actions.isTestSendPending}
            onSend={actions.testSend}
          />
          <AdminEmailFinalSendCard
            sendReadiness={draft.sendReadiness}
            isPending={actions.isFinalSendPending}
            onOpen={() => void actions.openFinalSend()}
          />
        </>
      ) : null}

      <AdminEmailDraftPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={preview?.subject ?? form.subject}
        html={preview?.html}
        isLoading={isPreviewFetching}
      />

      <AdminEmailDraftArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onConfirm={() =>
          void actions.archive().then(() => setArchiveOpen(false))
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
    </div>
  )
}
