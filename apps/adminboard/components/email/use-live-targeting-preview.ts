import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useAdminEmailTargetingPreview } from '@virtality/react-query'
import type { AdminEmailTopic } from '@virtality/shared/types'
import { useMemo } from 'react'

const DEBOUNCE_MS = 400

type LiveTargetingInput = {
  topic: AdminEmailTopic
  audienceId: string | null
  recipients: string[]
}

/**
 * Explicit list ∪ Audience − Opt-outs, resolved live from unsaved form values
 * (debounced). `isStale` is true while the shown numbers lag the form.
 */
export const useLiveTargetingPreview = ({
  topic,
  audienceId,
  recipients,
}: LiveTargetingInput) => {
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
  const query = useAdminEmailTargetingPreview(debouncedInput)

  return {
    data: query.data,
    isLoading: query.isLoading,
    isStale: query.isFetching || debouncedInput !== input,
  }
}
