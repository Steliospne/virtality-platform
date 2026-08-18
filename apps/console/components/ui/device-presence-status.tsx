import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeviceVrPresenceStatus } from '@/lib/vr-presence'

export function DevicePresenceStatus({
  status,
}: {
  status: DeviceVrPresenceStatus
}) {
  const statusClassName =
    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium'

  switch (status) {
    case 'loading':
      return (
        <span className={cn(statusClassName, 'text-muted-foreground')}>
          <Loader2 className='size-3 animate-spin' />
          Checking
        </span>
      )
    case 'online':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          Online
        </span>
      )
    case 'offline':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          Offline
        </span>
      )
    case 'unpaired':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-muted text-muted-foreground dark:bg-zinc-800',
          )}
        >
          Unpaired
        </span>
      )
    default: {
      const unhandledStatus: never = status
      return unhandledStatus
    }
  }
}
