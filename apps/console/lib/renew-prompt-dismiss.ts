/**
 * Client dismiss for in-app renew prompts. Keyed by Entitlement Clock epoch so
 * a new clock end (Checkout / Extension) can show the banner again.
 */

const STORAGE_PREFIX = 'virtality:renew-prompt-dismissed:' as const

export function renewPromptDismissStorageKey(
  userId: string,
  epochKey: string,
): string {
  return `${STORAGE_PREFIX}${userId}:${epochKey}`
}

export function isRenewPromptDismissed(
  userId: string,
  epochKey: string,
  storage: Pick<Storage, 'getItem'> = globalThis.localStorage,
): boolean {
  try {
    return (
      storage.getItem(renewPromptDismissStorageKey(userId, epochKey)) === '1'
    )
  } catch {
    return false
  }
}

export function dismissRenewPrompt(
  userId: string,
  epochKey: string,
  storage: Pick<Storage, 'setItem'> = globalThis.localStorage,
): void {
  try {
    storage.setItem(renewPromptDismissStorageKey(userId, epochKey), '1')
  } catch {
    // Private mode / quota: dismiss is best-effort for this session only.
  }
}

/** Profile Billing deep link used by renew chrome. */
export function profileBillingHref(userId: string): string {
  return `/user/${userId}/profile?tab=billing`
}
