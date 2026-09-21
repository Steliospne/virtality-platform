'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { AdminEmailRecipientSummary } from './admin-email-recipient-summary'

const NO_AUDIENCE = '__none__'
const topics = listAdminEmailTopics()

export type DraftTargetingState = {
  topic: AdminEmailTopic
  audienceId: string | null
  recipientsText: string
}

type AdminEmailDraftTargetingCardProps = {
  value: DraftTargetingState
  parsedRecipients: string[]
  disabled: boolean
  onChange: (update: Partial<DraftTargetingState>) => void
}

/** Topic, Audience and the explicit Email Recipient List for one draft. */
export const AdminEmailDraftTargetingCard = ({
  value,
  parsedRecipients,
  disabled,
  onChange,
}: AdminEmailDraftTargetingCardProps) => {
  const { data: audiences } = useEmailAudiences()
  const selectedTopic = topics.find((topic) => topic.id === value.topic)
  const parsedRecipientCount = parsedRecipients.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Targeting</CardTitle>
        <CardDescription>
          Every admin email goes out under one Topic. Recipients can opt out of
          it from the footer.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 lg:grid-cols-[1fr_260px]'>
        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>
                Topic
              </Label>
              <Select
                value={value.topic}
                disabled={disabled}
                onValueChange={(topic) =>
                  onChange({ topic: topic as AdminEmailTopic })
                }
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTopic ? (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {selectedTopic.description}
                </p>
              ) : null}
            </div>

            <div>
              <Label className='text-muted-foreground text-sm font-medium'>
                Audience
              </Label>
              <Select
                value={value.audienceId ?? NO_AUDIENCE}
                disabled={disabled}
                onValueChange={(audienceId) =>
                  onChange({
                    audienceId: audienceId === NO_AUDIENCE ? null : audienceId,
                  })
                }
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='No audience' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AUDIENCE}>No audience</SelectItem>
                  {(audiences ?? []).map((audience) => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-muted-foreground mt-1 text-xs'>
                Evaluated at send time. Manage under the Audiences tab.
              </p>
            </div>
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Additional recipients (max {MAX_EMAIL_RECIPIENTS})
            </Label>
            <Textarea
              className='mt-1 min-h-28'
              value={value.recipientsText}
              disabled={disabled}
              onChange={(event) =>
                onChange({ recipientsText: event.target.value })
              }
              placeholder='One email per line'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              {parsedRecipientCount} recipient
              {parsedRecipientCount === 1 ? '' : 's'} entered
            </p>
          </div>
        </div>

        <AdminEmailRecipientSummary
          topic={value.topic}
          audienceId={value.audienceId}
          recipients={parsedRecipients}
        />
      </CardContent>
    </Card>
  )
}
