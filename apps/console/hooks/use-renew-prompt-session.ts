'use client'

import { useEffect, useRef } from 'react'
import {
  useEvaluateRenewPrompts,
  useInAppRenewPrompts,
} from '@virtality/react-query'

/**
 * Runs epoch-keyed renew evaluation once on mount (System Email + in-app
 * delivery records), then exposes current-epoch in-app prompts for chrome.
 */
export function useRenewPromptSession() {
  const evaluate = useEvaluateRenewPrompts()
  const inAppQuery = useInAppRenewPrompts()
  const didEvaluate = useRef(false)

  useEffect(() => {
    if (didEvaluate.current) return
    didEvaluate.current = true
    evaluate.mutate(undefined)
  }, [evaluate])

  const prompts = inAppQuery.data?.inApp ?? evaluate.data?.inApp ?? []
  const entitled = inAppQuery.data?.entitled ?? evaluate.data?.entitled

  return {
    prompts: entitled === true ? prompts : [],
    isPending: evaluate.isPending || inAppQuery.isPending,
  }
}
