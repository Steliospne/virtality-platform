import type { RenewTriggerChannel } from '@virtality/shared/types'

export const RENEW_TRIGGER_CHANNEL_LABELS: Record<RenewTriggerChannel, string> =
  {
    email: 'Renew Email Triggers',
    in_app: 'Renew In-app Triggers',
  }

export const RENEW_TRIGGER_CHANNEL_DESCRIPTIONS: Record<
  RenewTriggerChannel,
  string
> = {
  email:
    'Day offsets before Entitlement Clock end for the renew System Email. Deactivate or remove all rows to silence email.',
  in_app:
    'Day offsets before Entitlement Clock end for in-app renew prompts. Deactivate or remove all rows to silence in-app.',
}

export const RENEW_TRIGGERS_PAGE_DESCRIPTION =
  'Configure independent email and in-app renew offsets. Lists may diverge. Email and in-app copy stay code-owned ([COPY]); they are not edited here.'

export function formatRenewTriggerOffsetLabel(daysBefore: number): string {
  const unit = daysBefore === 1 ? 'day' : 'days'
  return `${daysBefore} ${unit} before`
}
