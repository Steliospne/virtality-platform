'use client'

import { cn } from '@/lib/utils'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'

type AdminEmailDraftContentFieldsProps = {
  subject: string
  previewText: string
  disabled: boolean
  onChange: (update: { subject?: string; previewText?: string }) => void
  /** Borderless, large-type treatment for writer-style layouts. */
  variant?: 'default' | 'plain'
}

/** Subject and inbox preview text for one draft. */
export const AdminEmailDraftContentFields = ({
  subject,
  previewText,
  disabled,
  onChange,
  variant = 'default',
}: AdminEmailDraftContentFieldsProps) => {
  const plain = variant === 'plain'

  return (
    <div className={cn(plain ? 'space-y-1' : 'space-y-4')}>
      <div>
        {plain ? null : (
          <Label className='text-muted-foreground text-sm font-medium'>
            Subject
          </Label>
        )}
        <Input
          className={cn(
            'mt-1',
            plain &&
              'h-auto border-0 px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0',
          )}
          value={subject}
          disabled={disabled}
          onChange={(event) => onChange({ subject: event.target.value })}
          placeholder='Email subject'
        />
      </div>
      <div>
        {plain ? null : (
          <Label className='text-muted-foreground text-sm font-medium'>
            Preview text (optional)
          </Label>
        )}
        <Input
          className={cn(
            'mt-1',
            plain &&
              'text-muted-foreground h-auto border-0 px-0 shadow-none focus-visible:ring-0',
          )}
          value={previewText}
          disabled={disabled}
          onChange={(event) => onChange({ previewText: event.target.value })}
          placeholder={
            plain ? 'Preview text shown in the inbox' : 'Inbox preview snippet'
          }
        />
      </div>
    </div>
  )
}
