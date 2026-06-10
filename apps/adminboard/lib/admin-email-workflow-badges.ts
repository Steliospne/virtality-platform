const WARNING_BADGE_CLASS =
  'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'

const SUCCESS_BADGE_CLASS =
  'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100'

export type AdminEmailWorkflowBadgeInput =
  | { kind: 'test-send'; complete: boolean }
  | { kind: 'send-readiness'; ready: boolean }

export type AdminEmailWorkflowBadgeConfig = {
  label: string
  variant: 'outline'
  className: string
  /** Keeps badge width stable when status text changes between drafts. */
  minWidthClass: string
}

function createWorkflowBadgeConfig(
  label: string,
  isPositive: boolean,
  minWidthClass: string,
): AdminEmailWorkflowBadgeConfig {
  return {
    label,
    variant: 'outline',
    className: isPositive ? SUCCESS_BADGE_CLASS : WARNING_BADGE_CLASS,
    minWidthClass,
  }
}

export function getAdminEmailWorkflowBadgeConfig(
  input: AdminEmailWorkflowBadgeInput,
): AdminEmailWorkflowBadgeConfig {
  switch (input.kind) {
    case 'test-send':
      return createWorkflowBadgeConfig(
        input.complete ? 'Test send complete' : 'Test send required',
        input.complete,
        'min-w-[9.25rem]',
      )
    case 'send-readiness':
      return createWorkflowBadgeConfig(
        input.ready ? 'Send-ready' : 'Not send-ready',
        input.ready,
        'min-w-[6.75rem]',
      )
  }
}
