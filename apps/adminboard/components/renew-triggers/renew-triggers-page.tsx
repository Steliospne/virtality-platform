import { RenewTriggerChannelEditor } from '@/components/renew-triggers/renew-trigger-channel-editor'
import { RENEW_TRIGGERS_PAGE_DESCRIPTION } from '@/lib/renew-triggers'

export function RenewTriggersPage() {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Renew triggers</h1>
        <p className='text-muted-foreground mt-2 max-w-3xl'>
          {RENEW_TRIGGERS_PAGE_DESCRIPTION}
        </p>
      </div>
      <div className='grid gap-10 lg:grid-cols-2'>
        <RenewTriggerChannelEditor channel='email' />
        <RenewTriggerChannelEditor channel='in_app' />
      </div>
    </div>
  )
}
