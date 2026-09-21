'use client'

import type { AdminEmailDraftWorkspaceState } from '@/components/email/use-admin-email-draft-workspace'
import { Button } from '@/components/ui/button'
import {
  useAdminEmailDraftPreview,
  useAdminEmailDraftRecipients,
} from '@virtality/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { ArrowLeft, Send } from 'lucide-react'
import { TestSendPopover } from './test-send-popover'

type ReviewStepProps = {
  workspace: AdminEmailDraftWorkspaceState
  onBack: () => void
}

/** Rendered email, resolved breakdown, test send and the Final send entry. */
export const ReviewStep = ({ workspace, onBack }: ReviewStepProps) => {
  const { draft, isDirty, readOnly, actions } = workspace
  const { data: preview, isFetching: previewFetching } =
    useAdminEmailDraftPreview(isDirty ? null : draft.id)
  const { data: breakdown } = useAdminEmailDraftRecipients(draft.id)

  const rows = breakdown
    ? [
        ['From audience', breakdown.audienceCount],
        ['Additional', breakdown.explicitCount],
        ['In both', -breakdown.overlapCount],
        ['Opted out', -breakdown.suppressedCount],
      ]
    : []

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
      <Card>
        <CardHeader>
          <CardTitle>{draft.subject || 'Untitled draft'}</CardTitle>
          <CardDescription>
            Exactly what recipients will see, opt-out footer included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='bg-muted/50 rounded-lg border p-3'>
            {preview?.html ? (
              <iframe
                className='h-160 w-full rounded bg-white'
                srcDoc={preview.html}
                title='Email preview'
              />
            ) : (
              <p className='text-muted-foreground p-6 text-sm'>
                {previewFetching ? 'Rendering…' : 'Preview unavailable'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>Resolved from the saved draft.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold tracking-tight'>
              {breakdown?.totalCount ?? '…'}
            </p>
            <dl className='mt-3 divide-y text-sm'>
              {rows.map(([label, value]) => (
                <div key={label} className='flex justify-between py-1.5'>
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='font-mono tabular-nums'>{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {!readOnly ? (
          <Card>
            <CardContent className='space-y-3 pt-6'>
              <TestSendPopover
                isPending={actions.isTestSendPending}
                onSend={actions.testSend}
                size='default'
                className='w-full'
              />
              <Button
                type='button'
                className='w-full'
                onClick={() => void actions.openFinalSend()}
                disabled={
                  !draft.sendReadiness.ready || actions.isFinalSendPending
                }
              >
                <Send className='mr-2 size-4' />
                Final send to {breakdown?.totalCount ?? '…'}
              </Button>
              {!draft.sendReadiness.ready ? (
                <ul className='text-muted-foreground list-disc pl-4 text-xs'>
                  {draft.sendReadiness.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p className='text-muted-foreground text-xs'>
                  You will confirm the subject in the next dialog.
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Button type='button' variant='outline' onClick={onBack}>
          <ArrowLeft className='mr-2 size-4' />
          Target
        </Button>
      </div>
    </div>
  )
}
