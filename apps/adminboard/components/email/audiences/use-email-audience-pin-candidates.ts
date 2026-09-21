import type { EmailAudiencePinCandidate } from '@/lib/email-audience-pin-picker'
import { useUsers, useWaitlist } from '@virtality/react-query'
import { useMemo } from 'react'

/** Registered users first, then Waitlist emails not already registered. */
export const useEmailAudiencePinCandidates = (enabled: boolean) => {
  const users = useUsers()
  const waitlist = useWaitlist()

  const candidates = useMemo<EmailAudiencePinCandidate[]>(() => {
    if (!enabled) {
      return []
    }

    const userRows = users.data?.data.users ?? []
    const known = new Set(userRows.map((user) => user.email.toLowerCase()))

    return [
      ...userRows.map((user) => ({
        email: user.email,
        name: user.name,
        source: 'user' as const,
      })),
      ...(waitlist.data ?? [])
        .filter((entry) => !known.has(entry.email.toLowerCase()))
        .map((entry) => ({
          email: entry.email,
          name: null,
          source: 'waitlist' as const,
        })),
    ]
  }, [enabled, users.data, waitlist.data])

  return {
    candidates,
    isLoading: users.isLoading || waitlist.isLoading,
  }
}
