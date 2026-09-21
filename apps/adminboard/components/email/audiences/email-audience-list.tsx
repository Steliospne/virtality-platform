'use client'

import { Button } from '@/components/ui/button'
import { describeEmailAudienceRule } from '@/lib/email-audience-form'
import { cn } from '@/lib/utils'
import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import type { EmailAudienceRule } from '@virtality/shared/types'
import { Plus, Users } from 'lucide-react'

type AudienceListItem = {
  id: string
  name: string
  rule: EmailAudienceRule
  includeEmails: string[]
  attachedDraftCount: number
}

type EmailAudienceListProps = {
  audiences: AudienceListItem[]
  selectedId: string | null
  isComposing: boolean
  onSelect: (audienceId: string) => void
  onCompose: () => void
}

export const EmailAudienceList = ({
  audiences,
  selectedId,
  isComposing,
  onSelect,
  onCompose,
}: EmailAudienceListProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Audiences</CardTitle>
      <CardDescription>
        Internal recipient groups. Rules are evaluated at send time.
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-3'>
      <Button
        type='button'
        className='w-full'
        variant={isComposing ? 'secondary' : 'default'}
        onClick={onCompose}
      >
        <Plus className='mr-2 size-4' />
        New audience
      </Button>

      {audiences.length === 0 ? (
        <p className='text-muted-foreground text-sm'>No audiences yet.</p>
      ) : (
        <div className='space-y-2'>
          {audiences.map((audience) => (
            <button
              key={audience.id}
              type='button'
              onClick={() => onSelect(audience.id)}
              className={cn(
                'hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors',
                selectedId === audience.id && 'bg-accent',
              )}
            >
              <div className='flex items-start gap-3'>
                <Users className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <div className='min-w-0 flex-1 space-y-1'>
                  <p className='truncate font-medium'>{audience.name}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {describeEmailAudienceRule(
                      audience.rule,
                      audience.includeEmails.length,
                    )}
                  </p>
                  {audience.attachedDraftCount > 0 ? (
                    <Badge variant='outline'>
                      {audience.attachedDraftCount} draft
                      {audience.attachedDraftCount === 1 ? '' : 's'}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)
