'use client'

import { AdminEmailSentRecordView } from '@/components/email/admin-email-sent-record-view'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { EmailSelection } from './email-selection'

type SentRecordPageProps = {
  sentRecordId: string
  onSelect: (selection: EmailSelection) => void
  backLabel?: string
}

/** A sent record with a way back to the list, for list-then-detail layouts. */
export const SentRecordPage = ({
  sentRecordId,
  onSelect,
  backLabel = 'All emails',
}: SentRecordPageProps) => (
  <div className='space-y-4'>
    <Button
      type='button'
      variant='ghost'
      size='sm'
      onClick={() => onSelect(null)}
    >
      <ArrowLeft className='mr-1.5 size-4' />
      {backLabel}
    </Button>
    <AdminEmailSentRecordView
      sentRecordId={sentRecordId}
      onCloned={(draftId) => onSelect({ kind: 'draft', id: draftId })}
    />
  </div>
)
