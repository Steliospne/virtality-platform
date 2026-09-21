'use client'

import { AdminEmailRecipientSummary } from '@/components/email/admin-email-recipient-summary'
import type { AdminEmailDraftWorkspaceState } from '@/components/email/use-admin-email-draft-workspace'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEmailAudiences } from '@virtality/react-query'
import {
  MAX_EMAIL_RECIPIENTS,
  type AdminEmailTopic,
} from '@virtality/shared/types'
import { listAdminEmailTopics } from '@virtality/shared/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const topics = listAdminEmailTopics()

type TargetStepProps = {
  workspace: AdminEmailDraftWorkspaceState
  onBack: () => void
  onNext: () => void
}

/** Topic as chips, audiences as pickable rows, plus the explicit list. */
export const TargetStep = ({ workspace, onBack, onNext }: TargetStepProps) => {
  const { form, patch, parsedRecipients, readOnly } = workspace
  const { data: audiences } = useEmailAudiences()

  const audienceRows = [
    ...(audiences ?? []).map((audience) => ({
      id: audience.id as string | null,
      name: audience.name,
      description: audience.description ?? null,
    })),
    { id: null, name: 'No audience', description: 'Explicit list only' },
  ]

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
      <Card>
        <CardHeader>
          <CardTitle>Who receives this</CardTitle>
          <CardDescription>
            Recipients resolve at send time. Opt-outs are removed automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Topic
            </Label>
            <div className='mt-1.5 flex flex-wrap gap-2'>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type='button'
                  disabled={readOnly}
                  onClick={() => patch({ topic: topic.id as AdminEmailTopic })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60',
                    form.topic === topic.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {topic.label}
                </button>
              ))}
            </div>
            <p className='text-muted-foreground mt-1.5 text-xs'>
              {topics.find((topic) => topic.id === form.topic)?.description}
            </p>
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Audience
            </Label>
            <div className='mt-1.5 space-y-1.5'>
              {audienceRows.map((row) => (
                <button
                  key={row.id ?? '__none__'}
                  type='button'
                  disabled={readOnly}
                  onClick={() => patch({ audienceId: row.id })}
                  className={cn(
                    'hover:bg-accent w-full rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-60',
                    form.audienceId === row.id &&
                      'bg-accent border-foreground/40',
                  )}
                >
                  <p className='text-sm font-medium'>{row.name}</p>
                  {row.description ? (
                    <p className='text-muted-foreground text-xs'>
                      {row.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
            <p className='text-muted-foreground mt-1.5 text-xs'>
              <Link href='/audiences' className='underline'>
                Manage audiences
              </Link>
            </p>
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Additional recipients · {parsedRecipients.length} of{' '}
              {MAX_EMAIL_RECIPIENTS}
            </Label>
            <Textarea
              className='mt-1 min-h-24'
              value={form.recipientsText}
              disabled={readOnly}
              onChange={(event) =>
                patch({ recipientsText: event.target.value })
              }
              placeholder='One email per line'
            />
          </div>
        </CardContent>
      </Card>

      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Resolved right now</CardTitle>
            <CardDescription>Updates as you change targeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminEmailRecipientSummary
              topic={form.topic}
              audienceId={form.audienceId}
              recipients={parsedRecipients}
            />
          </CardContent>
        </Card>
        <div className='flex justify-between'>
          <Button type='button' variant='outline' onClick={onBack}>
            <ArrowLeft className='mr-2 size-4' />
            Compose
          </Button>
          <Button type='button' onClick={onNext}>
            Continue to review
            <ArrowRight className='ml-2 size-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
