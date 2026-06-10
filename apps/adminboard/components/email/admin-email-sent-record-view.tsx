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
import {
  useAdminEmailSentRecord,
  useCloneAdminEmailFromSent,
} from '@virtality/react-query'
import { format } from 'date-fns'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

type AdminEmailSentRecordViewProps = {
  sentRecordId: string
  onCloned: (draftId: string) => void
}

export const AdminEmailSentRecordView = ({
  sentRecordId,
  onCloned,
}: AdminEmailSentRecordViewProps) => {
  const { data: sentRecord, isLoading } = useAdminEmailSentRecord(sentRecordId)
  const cloneMutation = useCloneAdminEmailFromSent()

  const handleClone = async () => {
    try {
      const cloned = await cloneMutation.mutateAsync({ sentRecordId })
      toast.success('Cloned into new draft')
      onCloned(cloned.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to clone sent record',
      )
    }
  }

  if (isLoading || !sentRecord) {
    return (
      <Card>
        <CardContent className='py-12'>
          <p className='text-muted-foreground text-center'>Loading sent record...</p>
        </CardContent>
      </Card>
    )
  }

  const successCount = sentRecord.deliveryResults.filter(
    (result) => result.status === 'sent',
  ).length
  const failedCount = sentRecord.deliveryResults.length - successCount

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle>{sentRecord.subject || 'Untitled email'}</CardTitle>
              <CardDescription>
                Sent {format(new Date(sentRecord.sentAt), 'MMM d, yyyy HH:mm')}
              </CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>Sent record</Badge>
              {failedCount > 0 ? (
                <Badge variant='outline'>
                  {successCount} sent, {failedCount} failed
                </Badge>
              ) : (
                <Badge>{successCount} delivered</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm'>
            <p>
              <span className='text-muted-foreground'>Recipients:</span>{' '}
              {sentRecord.recipients.length}
            </p>
            <p className='mt-1'>
              <span className='text-muted-foreground'>Draft created:</span>{' '}
              {format(new Date(sentRecord.draftCreatedAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>

          <Button type='button' variant='outline' onClick={() => void handleClone()}>
            <Copy className='mr-2 size-4' />
            Clone into new draft
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendered snapshot</CardTitle>
          <CardDescription>
            Immutable snapshot captured at final send.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='mb-3 text-lg font-medium'>
            {sentRecord.renderedSnapshot.subject}
          </p>
          <div className='bg-muted/50 min-h-[300px] rounded-lg border p-4'>
            <iframe
              className='h-full min-h-[300px] w-full'
              srcDoc={sentRecord.renderedSnapshot.html}
              title='Sent email snapshot'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery results</CardTitle>
          <CardDescription>Per-recipient outcomes from final send.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {sentRecord.deliveryResults.map((result) => (
            <div
              key={`${result.recipientEmail}-${result.attemptedAt.toString()}`}
              className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm'
            >
              <span>{result.recipientEmail}</span>
              <div className='flex items-center gap-2'>
                <Badge variant={result.status === 'sent' ? 'secondary' : 'outline'}>
                  {result.status}
                </Badge>
                {result.errorMessage ? (
                  <span className='text-muted-foreground text-xs'>
                    {result.errorMessage}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
