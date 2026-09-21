'use client'

import { Button } from '@/components/ui/button'
import { MAX_EMAIL_AUDIENCE_PINS } from '@virtality/shared/types'
import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Textarea } from '@virtality/ui/components/textarea'
import { appendEmailAudiencePin } from '@/lib/email-audience-pin-picker'
import { Save, Trash2 } from 'lucide-react'
import { EmailAudiencePinPicker } from './email-audience-pin-picker'
import { EmailAudiencePreviewCard } from './email-audience-preview-card'
import { EmailAudienceRuleFields } from './email-audience-rule-fields'
import { useEmailAudienceEditor } from './use-email-audience-editor'

type EmailAudienceEditorProps = Parameters<typeof useEmailAudienceEditor>[0]

export const EmailAudienceEditor = (props: EmailAudienceEditorProps) => {
  const editor = useEmailAudienceEditor(props)
  const { form, patch } = editor
  const audience = props.audience
  const canDelete = audience !== null && audience.attachedDraftCount === 0

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle>
                {audience ? 'Edit audience' : 'New audience'}
              </CardTitle>
              <CardDescription>
                A dynamic rule plus static include and exclude pins. Never shown
                to recipients.
              </CardDescription>
            </div>
            {editor.isDirty ? (
              <Badge variant='outline'>Unsaved changes</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Name
            </Label>
            <Input
              className='mt-1'
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder='e.g. Active clinicians'
            />
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Description (optional)
            </Label>
            <Input
              className='mt-1'
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder='Who this reaches and why'
            />
          </div>

          <div>
            <Label className='text-muted-foreground text-sm font-medium'>
              Dynamic rule
            </Label>
            <div className='mt-1'>
              <EmailAudienceRuleFields
                rule={form.rule}
                onChange={(rule) => patch({ rule })}
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <div className='flex items-center justify-between gap-2'>
                <Label className='text-muted-foreground text-sm font-medium'>
                  Always include (max {MAX_EMAIL_AUDIENCE_PINS})
                </Label>
                <EmailAudiencePinPicker
                  pinnedText={form.includeText}
                  onPick={(email) =>
                    patch({
                      includeText: appendEmailAudiencePin(
                        form.includeText,
                        email,
                      ),
                    })
                  }
                />
              </div>
              <Textarea
                className='mt-1 min-h-28'
                value={form.includeText}
                onChange={(event) => patch({ includeText: event.target.value })}
                placeholder='One email per line'
              />
            </div>
            <div>
              <div className='flex items-center justify-between gap-2'>
                <Label className='text-muted-foreground text-sm font-medium'>
                  Always exclude (max {MAX_EMAIL_AUDIENCE_PINS})
                </Label>
                <EmailAudiencePinPicker
                  pinnedText={form.excludeText}
                  onPick={(email) =>
                    patch({
                      excludeText: appendEmailAudiencePin(
                        form.excludeText,
                        email,
                      ),
                    })
                  }
                />
              </div>
              <Textarea
                className='mt-1 min-h-28'
                value={form.excludeText}
                onChange={(event) => patch({ excludeText: event.target.value })}
                placeholder='One email per line'
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              onClick={() => void editor.save()}
              disabled={!editor.isDirty || editor.isSaving}
            >
              <Save className='mr-2 size-4' />
              {editor.isSaving
                ? 'Saving...'
                : audience
                  ? 'Save audience'
                  : 'Create audience'}
            </Button>
            {audience ? (
              <Button
                type='button'
                variant='outline'
                onClick={() => void editor.remove()}
                disabled={!canDelete || editor.isDeleting}
                title={
                  canDelete
                    ? undefined
                    : 'Detach from active drafts before deleting'
                }
              >
                <Trash2 className='mr-2 size-4' />
                Delete
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <EmailAudiencePreviewCard
        result={editor.previewResult}
        isPending={editor.isPreviewing}
        onEvaluate={() => void editor.preview()}
      />
    </div>
  )
}
