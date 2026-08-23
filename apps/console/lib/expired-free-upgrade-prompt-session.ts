/**
 * Client session state for the expired-Free upgrade dialog. Dismissal and
 * twelve-hour recurrence are scoped to the browser session; a new Better Auth
 * session id always qualifies as a fresh authenticated login.
 */

const STORAGE_PREFIX = 'virtality:expired-free-upgrade:' as const

export type ExpiredFreeUpgradePromptSessionState = {
  lastPromptAt: Date | null
  seenSessionId: string | null
}

type StoredExpiredFreeUpgradePromptSession = {
  lastPromptAt?: string
  seenSessionId?: string
}

export function expiredFreeUpgradePromptSessionKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

export function readExpiredFreeUpgradePromptSession(
  storage: Pick<Storage, 'getItem'>,
  userId: string,
): ExpiredFreeUpgradePromptSessionState {
  try {
    const raw = storage.getItem(expiredFreeUpgradePromptSessionKey(userId))
    if (!raw) {
      return { lastPromptAt: null, seenSessionId: null }
    }
    const parsed = JSON.parse(raw) as StoredExpiredFreeUpgradePromptSession
    const lastPromptAt =
      parsed.lastPromptAt != null ? new Date(parsed.lastPromptAt) : null
    if (lastPromptAt != null && Number.isNaN(lastPromptAt.getTime())) {
      return { lastPromptAt: null, seenSessionId: parsed.seenSessionId ?? null }
    }
    return {
      lastPromptAt,
      seenSessionId: parsed.seenSessionId ?? null,
    }
  } catch {
    return { lastPromptAt: null, seenSessionId: null }
  }
}

export function recordExpiredFreeUpgradePromptShown(
  storage: Pick<Storage, 'setItem'>,
  userId: string,
  input: { now: Date; sessionId: string },
): void {
  try {
    storage.setItem(
      expiredFreeUpgradePromptSessionKey(userId),
      JSON.stringify({
        lastPromptAt: input.now.toISOString(),
        seenSessionId: input.sessionId,
      }),
    )
  } catch {
    // Private mode / quota: best-effort for this browser session.
  }
}

export function isNewAuthenticatedSession(
  seenSessionId: string | null,
  currentSessionId: string,
): boolean {
  return seenSessionId == null || seenSessionId !== currentSessionId
}
