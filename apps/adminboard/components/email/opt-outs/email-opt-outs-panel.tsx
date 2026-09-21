'use client'

import { useEmailOptOuts } from '@virtality/react-query'
import { EmailOptOutTable } from './email-opt-out-table'
import { RecordEmailOptOutDialog } from './record-email-opt-out-dialog'

export const EmailOptOutsPanel = () => {
  const { data: optOuts, isLoading } = useEmailOptOuts()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading opt-outs...</p>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          Enforced at Final Send for every recipient, however they reached the
          draft.
        </p>
        <RecordEmailOptOutDialog />
      </div>
      <EmailOptOutTable optOuts={optOuts ?? []} />
    </div>
  )
}
