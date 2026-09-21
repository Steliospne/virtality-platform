'use client'

import { Switch } from '@/components/ui/switch'
import {
  EMAIL_AUDIENCE_ROLE_LABELS,
  toggleEmailAudienceRole,
} from '@/lib/email-audience-form'
import { cn } from '@/lib/utils'
import {
  EMAIL_AUDIENCE_USER_ROLES,
  type EmailAudienceRule,
} from '@virtality/shared/types'
import { Label } from '@virtality/ui/components/label'

type EmailAudienceRuleFieldsProps = {
  rule: EmailAudienceRule
  disabled?: boolean
  onChange: (rule: EmailAudienceRule) => void
}

/** The dynamic half of an Audience: which live sources it draws from. */
export const EmailAudienceRuleFields = ({
  rule,
  disabled = false,
  onChange,
}: EmailAudienceRuleFieldsProps) => (
  <div className='space-y-4 rounded-lg border p-4'>
    <div className='flex items-center justify-between gap-4'>
      <div>
        <Label className='text-sm font-medium'>Registered users</Label>
        <p className='text-muted-foreground text-xs'>
          Active accounts (not deleted or banned), read at send time.
        </p>
      </div>
      <Switch
        checked={rule.includeUsers}
        disabled={disabled}
        onCheckedChange={(includeUsers) => onChange({ ...rule, includeUsers })}
      />
    </div>

    <div
      className={cn(
        'flex flex-wrap gap-2 pl-1',
        !rule.includeUsers && 'pointer-events-none opacity-50',
      )}
    >
      {EMAIL_AUDIENCE_USER_ROLES.map((role) => {
        const active =
          rule.userRoles.length === 0 || rule.userRoles.includes(role)
        return (
          <button
            key={role}
            type='button'
            disabled={disabled}
            onClick={() =>
              onChange({
                ...rule,
                userRoles: toggleEmailAudienceRole(rule.userRoles, role),
              })
            }
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {EMAIL_AUDIENCE_ROLE_LABELS[role]}
          </button>
        )
      })}
      <p className='text-muted-foreground w-full text-xs'>
        {rule.userRoles.length === 0
          ? 'All roles. Pick roles to narrow.'
          : 'Only the selected roles.'}
      </p>
    </div>

    <div className='flex items-center justify-between gap-4'>
      <div>
        <Label className='text-sm font-medium'>Waitlist</Label>
        <p className='text-muted-foreground text-xs'>
          Emails that joined the website waitlist.
        </p>
      </div>
      <Switch
        checked={rule.includeWaitlist}
        disabled={disabled}
        onCheckedChange={(includeWaitlist) =>
          onChange({ ...rule, includeWaitlist })
        }
      />
    </div>
  </div>
)
