'use client'

import { useEmailOptOuts } from '@virtality/react-query'
import { EmailOptOutTable } from './email-opt-out-table'
import { RecordEmailOptOutForm } from './record-email-opt-out-form'

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
    <div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
      <RecordEmailOptOutForm />
      <EmailOptOutTable optOuts={optOuts ?? []} />
    </div>
  )
}
