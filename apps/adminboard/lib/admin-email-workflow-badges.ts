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
}

export function getAdminEmailWorkflowBadgeConfig(
  input: AdminEmailWorkflowBadgeInput,
): AdminEmailWorkflowBadgeConfig {
  if (input.kind === 'test-send') {
    return input.complete
      ? {
          label: 'Test send complete',
          variant: 'outline',
          className: SUCCESS_BADGE_CLASS,
        }
      : {
          label: 'Test send required',
          variant: 'outline',
          className: WARNING_BADGE_CLASS,
        }
  }

  return input.ready
    ? {
        label: 'Send-ready',
        variant: 'outline',
        className: SUCCESS_BADGE_CLASS,
      }
    : {
        label: 'Not send-ready',
        variant: 'outline',
        className: WARNING_BADGE_CLASS,
      }
}
