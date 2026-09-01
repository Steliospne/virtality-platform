export type ProfileTab = 'info' | 'billing' | 'sessions'

type NonBillingProfileTab = Exclude<ProfileTab, 'billing'>

const PROFILE_TABS = new Set<NonBillingProfileTab>(['info', 'sessions'])

function isNonBillingProfileTab(value: string): value is NonBillingProfileTab {
  return PROFILE_TABS.has(value as NonBillingProfileTab)
}

export function resolveProfileTab(
  requested: string | null | undefined,
  billingEnabled: boolean,
): ProfileTab {
  if (requested === 'billing') {
    return billingEnabled ? 'billing' : 'info'
  }
  if (requested != null && isNonBillingProfileTab(requested)) {
    return requested
  }
  return 'info'
}

/** Profile tab deep link on the current pathname (`info` omits `?tab=`). */
export function profileTabHref(pathname: string, tab: ProfileTab): string {
  if (tab === 'info') return pathname
  const params = new URLSearchParams({ tab })
  return `${pathname}?${params.toString()}`
}
