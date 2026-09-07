'use client'

import { useEffect } from 'react'
import { useMarkTrialWelcomeSeen } from '@virtality/react-query'
import { authClient } from '@/auth-client'
import useMounted from '@/hooks/use-mounted'

export function useTrialWelcomePage() {
  const mounted = useMounted()
  const { data: session, isPending } = authClient.useSession()
  const { mutate, isPending: isMarking, isSuccess } = useMarkTrialWelcomeSeen()
  const ready = mounted && !isPending && Boolean(session?.user?.id)

  useEffect(() => {
    if (!ready || isMarking || isSuccess) return
    mutate({})
  }, [ready, isMarking, isSuccess, mutate])

  return { ready }
}
