import { RenewTriggerChannelEditor } from '@/components/renew-triggers/renew-trigger-channel-editor'

export function RenewTriggersPage() {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <div className='grid gap-10 lg:grid-cols-2'>
        <RenewTriggerChannelEditor channel='email' />
        <RenewTriggerChannelEditor channel='in_app' />
      </div>
    </div>
  )
}
