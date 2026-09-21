'use client'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import { useAdminEmailTargetingPreview } from '@virtality/react-query'
import type { AdminEmailTopic } from '@virtality/shared/types'
import { useMemo } from 'react'

type AdminEmailRecipientSummaryProps = {
  topic: AdminEmailTopic
  audienceId: string | null
  /** Parsed explicit recipients from the textarea. */
  recipients: string[]
}

const DEBOUNCE_MS = 400

/**
 * Explicit list ∪ Audience, minus Opt-outs — what Final Send will deliver to,
 * resolved live from the form as the admin edits (no save needed).
 */
export const AdminEmailRecipientSummary = ({
  topic,
  audienceId,
  recipients,
}: AdminEmailRecipientSummaryProps) => {
  const recipientsKey = recipients.join('\n')
  const input = useMemo(
    () => ({
      topic,
      audienceId,
      recipients: recipientsKey.split('\n').filter(Boolean),
    }),
    [topic, audienceId, recipientsKey],
  )
  const debouncedInput = useDebouncedValue(input, DEBOUNCE_MS)
  const { data, isLoading, isFetching } =
    useAdminEmailTargetingPreview(debouncedInput)

  if (isLoading || !data) {
    return (
      <p className='text-muted-foreground text-xs'>Resolving recipients...</p>
    )
  }

  const isStale = isFetching || debouncedInput !== input

  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm transition-opacity',
        isStale && 'opacity-60',
      )}
    >
      <p className='text-2xl font-semibold'>
        {data.totalCount}{' '}
        <span className='text-muted-foreground text-sm font-normal'>
          will receive this
        </span>
      </p>
      <dl className='text-muted-foreground mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs'>
        <dt>Explicit list</dt>
        <dd className='text-foreground'>{data.explicitCount}</dd>
        <dt>Audience{data.audienceName ? ` · ${data.audienceName}` : ''}</dt>
        <dd className='text-foreground'>{data.audienceCount}</dd>
        {data.overlapCount > 0 ? (
          <>
            <dt>In both</dt>
            <dd className='text-foreground'>−{data.overlapCount}</dd>
          </>
        ) : null}
        <dt>Opted out</dt>
        <dd className='text-foreground'>−{data.suppressedCount}</dd>
      </dl>
    </div>
  )
}
