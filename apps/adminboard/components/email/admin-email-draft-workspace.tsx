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
import {
  formatRecipientsForInput,
  parseRecipientsFromInput,
} from '@/lib/admin-email-recipients'
import { cn } from '@/lib/utils'
import type { EmailBodyBlock } from '@virtality/shared/types'
import { MAX_EMAIL_RECIPIENTS } from '@virtality/shared/types'
import {
  getAdminEmailDraftPreviewQueryDraftId,
  prepareAdminEmailDraftPreview,
} from '@/lib/admin-email-draft-actions'
import {
  useAdminEmailDraftPreview,
  useCloneAdminEmailDraft,
  useFinalSendAdminEmailDraft,
  useTestSendAdminEmailDraft,
  useUpdateAdminEmailDraft,
} from '@virtality/react-query'
import { Save, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminEmailDraftHeaderMenu } from './admin-email-draft-header-menu'
import { AdminEmailDraftPreviewDialog } from './admin-email-draft-preview-dialog'
import { EmailBlockBuilder } from './email-block-builder'
import { FinalSendDialog } from './final-send-dialog'

type DraftWorkspaceData = {
  id: string
  subject: string
  previewText: string | null
  bodyBlocks: EmailBodyBlock[]
  recipients: string[]
  hasSuccessfulTestSend: boolean
  isFinalSent: boolean
  updatedAt: string | Date
  sendReadiness: {
    ready: boolean
    reasons: string[]
  }
}

type AdminEmailDraftWorkspaceProps = {
  draft: DraftWorkspaceData
  onCloned: (draftId: string) => void
  onFinalSent: (sentRecordId: string) => void
}

type DraftFormState = {
  subject: string
  previewText: string
  bodyBlocks: EmailBodyBlock[]
  recipientsText: string
}

const toFormState = (draft: DraftWorkspaceData): DraftFormState => ({
  subject: draft.subject,
  previewText: draft.previewText ?? '',
  bodyBlocks: draft.bodyBlocks,
  recipientsText: formatRecipientsForInput(draft.recipients),
})

export const AdminEmailDraftWorkspace = ({
  draft,
  onCloned,
  onFinalSent,
}: AdminEmailDraftWorkspaceProps) => {
  const [form, setForm] = useState<DraftFormState>(() => toFormState(draft))
  const [previewOpen, setPreviewOpen] = useState(false)
  const [testRecipientEmail, setTestRecipientEmail] = useState('')
  const [finalSendOpen, setFinalSendOpen] = useState(false)
  const [confirmedSubject, setConfirmedSubject] = useState('')

  const updateDraftMutation = useUpdateAdminEmailDraft()
  const cloneDraftMutation = useCloneAdminEmailDraft()
  const testSendMutation = useTestSendAdminEmailDraft(draft.id)
  const finalSendMutation = useFinalSendAdminEmailDraft()

  const parsedRecipients = useMemo(
    () => parseRecipientsFromInput(form.recipientsText),
    [form.recipientsText],
  )

  const isDirty = useMemo(() => {
    const saved = toFormState(draft)
    return (
      form.subject !== saved.subject ||
      form.previewText !== saved.previewText ||
      form.recipientsText !== saved.recipientsText ||
      JSON.stringify(form.bodyBlocks) !== JSON.stringify(saved.bodyBlocks)
    )
  }, [draft, form])

  useEffect(() => {
    setForm(toFormState(draft))
    setPreviewOpen(false)
    setConfirmedSubject('')
  }, [draft.id, draft.updatedAt])

  const previewQueryDraftId = getAdminEmailDraftPreviewQueryDraftId({
    previewOpen,
    isDirty,
    draftId: draft.id,
  })

  const { data: preview, refetch: refetchPreview, isFetching: isPreviewFetching } =
    useAdminEmailDraftPreview(previewQueryDraftId)

  const saveDraft = async () => {
    try {
      const updated = await updateDraftMutation.mutateAsync({
        draftId: draft.id,
        subject: form.subject,
        previewText: form.previewText.trim() ? form.previewText : null,
        bodyBlocks: form.bodyBlocks,
        recipients: parsedRecipients,
      })
      toast.success('Draft saved')
      return updated
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft')
      return null
    }
  }

  const handlePreview = async () => {
    const canPreview = await prepareAdminEmailDraftPreview({
      isDirty,
      saveDraft,
    })
    if (!canPreview) {
      return
    }

    setPreviewOpen(true)
    void refetchPreview()
  }

  const handleTestSend = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!testRecipientEmail.includes('@')) {
      toast.error('Enter a valid test recipient email')
      return
    }

    if (isDirty) {
      const saved = await saveDraft()
      if (!saved) {
        return
      }
    }

    try {
      await testSendMutation.mutateAsync({
        draftId: draft.id,
        testRecipientEmail: testRecipientEmail.trim(),
      })
      toast.success(`Test email sent to ${testRecipientEmail.trim()}`)
      setTestRecipientEmail('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send test email',
      )
    }
  }

  const handleFinalSend = async () => {
    const savedDraft = isDirty ? await saveDraft() : null
    if (isDirty && !savedDraft) {
      return
    }

    const subject = savedDraft?.subject ?? draft.subject
    const recipientCount =
      savedDraft?.recipients.length ?? draft.recipients.length

    try {
      const sentRecord = await finalSendMutation.mutateAsync({
        draftId: draft.id,
        confirmedSubject: subject,
        confirmedRecipientCount: recipientCount,
      })
      toast.success('Email sent')
      setFinalSendOpen(false)
      setConfirmedSubject('')
      onFinalSent(sentRecord.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    }
  }

  const handleClone = async () => {
    try {
      const cloned = await cloneDraftMutation.mutateAsync({ draftId: draft.id })
      toast.success('Draft cloned')
      onCloned(cloned.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clone draft')
    }
  }

  const readOnly = draft.isFinalSent

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle>{readOnly ? 'Sent draft (read-only)' : 'Edit draft'}</CardTitle>
              <CardDescription>
                Edit the subject and Email Body Blocks. The Email Brand Shell stays
                locked.
              </CardDescription>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <AdminEmailWorkflowBadge
                kind='test-send'
                complete={draft.hasSuccessfulTestSend}
              />
              <AdminEmailWorkflowBadge
                kind='send-readiness'
                ready={draft.sendReadiness.ready}
              />
              <Badge
                variant='outline'
                className={cn(
                  'min-w-[8.5rem]',
                  !isDirty && 'pointer-events-none invisible',
                )}
              >
                Unsaved changes
              </Badge>
              <AdminEmailDraftHeaderMenu
                isFinalSent={readOnly}
                onPreview={() => void handlePreview()}
                onClone={() => void handleClone()}
                isClonePending={cloneDraftMutation.isPending}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Subject
            </label>
            <Input
              className='mt-1'
              value={form.subject}
              disabled={readOnly}
              onChange={(event) =>
                setForm((current) => ({ ...current, subject: event.target.value }))
              }
              placeholder='Email subject'
            />
          </div>

          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Preview text (optional)
            </label>
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

          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Recipients (max {MAX_EMAIL_RECIPIENTS})
            </label>
            <textarea
              className='bg-background mt-1 min-h-28 w-full rounded-md border px-3 py-2 text-sm'
              value={form.recipientsText}
              disabled={readOnly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recipientsText: event.target.value,
                }))
              }
              placeholder='One email per line'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              {parsedRecipients.length} recipient
              {parsedRecipients.length === 1 ? '' : 's'} entered
            </p>
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
              onClick={() => void saveDraft()}
              disabled={!isDirty || updateDraftMutation.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateDraftMutation.isPending ? 'Saving...' : 'Save draft'}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {!readOnly ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Test send</CardTitle>
              <CardDescription>
                Send a test email to your inbox before final send.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleTestSend}
                className='flex flex-col gap-3 sm:flex-row sm:items-end'
              >
                <div className='flex-1'>
                  <label className='text-muted-foreground mb-1.5 block text-sm font-medium'>
                    Test recipient
                  </label>
                  <Input
                    type='email'
                    value={testRecipientEmail}
                    onChange={(event) => setTestRecipientEmail(event.target.value)}
                    placeholder='you@example.com'
                  />
                </div>
                <Button type='submit' disabled={testSendMutation.isPending}>
                  <Send className='mr-2 size-4' />
                  {testSendMutation.isPending ? 'Sending...' : 'Send test'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Final send</CardTitle>
              <CardDescription>
                Immediate and irreversible. Requires a send-ready draft.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {!draft.sendReadiness.ready ? (
                <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-sm'>
                  {draft.sendReadiness.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              <Button
                type='button'
                onClick={async () => {
                  if (isDirty) {
                    const saved = await saveDraft()
                    if (!saved) {
                      return
                    }
                  }

                  setConfirmedSubject('')
                  setFinalSendOpen(true)
                }}
                disabled={!draft.sendReadiness.ready || finalSendMutation.isPending}
              >
                <Send className='mr-2 size-4' />
                Final send
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}

      <AdminEmailDraftPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={preview?.subject ?? form.subject}
        html={preview?.html}
        isLoading={isPreviewFetching}
      />

      <FinalSendDialog
        open={finalSendOpen}
        onOpenChange={setFinalSendOpen}
        subject={form.subject}
        recipientCount={parsedRecipients.length}
        confirmedSubject={confirmedSubject}
        onConfirmedSubjectChange={setConfirmedSubject}
        onConfirm={() => void handleFinalSend()}
        isPending={finalSendMutation.isPending}
      />
    </div>
  )
}
