'use client'

import { useRenewPromptSession } from '@/hooks/use-renew-prompt-session'

/**
 * In-app renew offset chrome for the seat holder. Copy stays [COPY] until
 * marketing pins strings. Hidden after Entitlement Clock expiry.
 */
export function RenewPromptBanner() {
  const { prompts } = useRenewPromptSession()

  if (prompts.length === 0) {
    return null
  }

  const nearestDaysBefore = Math.min(
    ...prompts.map((prompt) => prompt.daysBefore),
  )

  return (
    <div
      role='status'
      className='border-b border-zinc-300 bg-zinc-100 px-4 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <p className='font-medium'>[COPY]</p>
      <p className='text-muted-foreground'>
        [COPY] ({nearestDaysBefore}d before Entitlement Clock end)
      </p>
    </div>
  )
}
