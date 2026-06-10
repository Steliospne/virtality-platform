'use client'

import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useAdminEmailDrafts,
  useAdminEmailSentRecords,
  useCreateAdminEmailDraft,
} from '@virtality/react-query'
import { format } from 'date-fns'
import { FileText, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminEmailDraftWorkspace } from './admin-email-draft-workspace'
import { AdminEmailSentRecordView } from './admin-email-sent-record-view'

type Selection =
  | { kind: 'draft'; id: string }
  | { kind: 'sent'; id: string }
  | null

export const AdminAuthoredEmailsPanel = () => {
  const [selection, setSelection] = useState<Selection>(null)
  const { data: drafts, isLoading: draftsLoading } = useAdminEmailDrafts()
  const { data: sentRecords, isLoading: sentLoading } = useAdminEmailSentRecords()
  const createDraftMutation = useCreateAdminEmailDraft()

  const selectedDraft = drafts?.find(
    (draft) => selection?.kind === 'draft' && draft.id === selection.id,
  )

  const handleCreateDraft = async () => {
    try {
      const draft = await createDraftMutation.mutateAsync(undefined)
      setSelection({ kind: 'draft', id: draft.id })
      toast.success('Draft created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create draft')
    }
  }

  if (draftsLoading || sentLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading admin-authored emails...</p>
      </div>
    )
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Email drafts</CardTitle>
            <CardDescription>
              Editable until final send. Clone drafts to reuse structure.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button
              type='button'
              className='w-full'
              onClick={() => void handleCreateDraft()}
              disabled={createDraftMutation.isPending}
            >
              <Plus className='mr-2 size-4' />
              New draft
            </Button>

            {(drafts ?? []).length === 0 ? (
              <p className='text-muted-foreground text-sm'>No drafts yet.</p>
            ) : (
              <div className='space-y-2'>
                {(drafts ?? []).map((draft) => (
                  <button
                    key={draft.id}
                    type='button'
                    onClick={() => setSelection({ kind: 'draft', id: draft.id })}
                    className={cn(
                      'hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors',
                      selection?.kind === 'draft' && selection.id === draft.id
                        ? 'bg-accent'
                        : '',
                    )}
                  >
                    <div className='flex items-start gap-3'>
                      <FileText className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                      <div className='min-w-0 flex-1 space-y-1'>
                        <p className='truncate font-medium'>
                          {draft.subject.trim() || 'Untitled draft'}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          Updated {format(new Date(draft.updatedAt), 'MMM d, yyyy HH:mm')}
                        </p>
                        <div className='flex flex-wrap gap-1'>
                          {draft.isFinalSent ? (
                            <Badge variant='outline'>Final sent</Badge>
                          ) : draft.sendReadiness.ready ? (
                            <Badge>Send-ready</Badge>
                          ) : (
                            <Badge variant='secondary'>Draft</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent records</CardTitle>
            <CardDescription>
              Immutable audit trail with rendered snapshots and delivery results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(sentRecords ?? []).length === 0 ? (
              <p className='text-muted-foreground text-sm'>No sent records yet.</p>
            ) : (
              <div className='space-y-2'>
                {(sentRecords ?? []).map((sentRecord) => {
                  const failedCount = sentRecord.deliveryResults.filter(
                    (result) => result.status === 'failed',
                  ).length

                  return (
                    <button
                      key={sentRecord.id}
                      type='button'
                      onClick={() => setSelection({ kind: 'sent', id: sentRecord.id })}
                      className={cn(
                        'hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors',
                        selection?.kind === 'sent' && selection.id === sentRecord.id
                          ? 'bg-accent'
                          : '',
                      )}
                    >
                      <div className='flex items-start gap-3'>
                        <Send className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                        <div className='min-w-0 flex-1 space-y-1'>
                          <p className='truncate font-medium'>
                            {sentRecord.subject || 'Untitled email'}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            Sent {format(new Date(sentRecord.sentAt), 'MMM d, yyyy HH:mm')}
                          </p>
                          <Badge variant={failedCount > 0 ? 'outline' : 'secondary'}>
                            {sentRecord.recipients.length} recipients
                            {failedCount > 0 ? `, ${failedCount} failed` : ''}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        {!selection ? (
          <Card>
            <CardContent className='flex min-h-[400px] items-center justify-center py-12'>
              <p className='text-muted-foreground'>
                Select a draft or sent record to view details.
              </p>
            </CardContent>
          </Card>
        ) : selection.kind === 'sent' ? (
          <AdminEmailSentRecordView
            sentRecordId={selection.id}
            onCloned={(draftId) => setSelection({ kind: 'draft', id: draftId })}
          />
        ) : selectedDraft ? (
          <AdminEmailDraftWorkspace
            draft={{
              id: selectedDraft.id,
              subject: selectedDraft.subject,
              previewText: selectedDraft.previewText,
              bodyBlocks: selectedDraft.bodyBlocks,
              recipients: selectedDraft.recipients,
              hasSuccessfulTestSend: selectedDraft.hasSuccessfulTestSend,
              isFinalSent: selectedDraft.isFinalSent,
              sendReadiness: selectedDraft.sendReadiness,
              updatedAt: selectedDraft.updatedAt,
            }}
            onCloned={(draftId) => setSelection({ kind: 'draft', id: draftId })}
            onFinalSent={(sentRecordId) =>
              setSelection({ kind: 'sent', id: sentRecordId })
            }
          />
        ) : (
          <Card>
            <CardContent className='py-12'>
              <p className='text-muted-foreground text-center'>Draft not found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
