export type ProfileTab = 'info' | 'billing' | 'organizations' | 'sessions'

const PROFILE_TABS = new Set<Exclude<ProfileTab, 'billing'>>([
  'info',
  'organizations',
  'sessions',
])

export function resolveProfileTab(
  requested: string | null | undefined,
  billingEnabled: boolean,
): ProfileTab {
  if (requested === 'billing') {
    return billingEnabled ? 'billing' : 'info'
  }
  if (requested != null && PROFILE_TABS.has(requested as ProfileTab)) {
    return requested as ProfileTab
  }
  return 'info'
}

/** Profile tab deep link on the current pathname (`info` omits `?tab=`). */
export function profileTabHref(pathname: string, tab: ProfileTab): string {
  if (tab === 'info') return pathname
  const params = new URLSearchParams({ tab })
  return `${pathname}?${params.toString()}`
}
