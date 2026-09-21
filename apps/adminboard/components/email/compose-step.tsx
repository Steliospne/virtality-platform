'use client'

import { AdminEmailDraftContentFields } from '@/components/email/admin-email-draft-content-fields'
import { EmailBlockBuilder } from '@/components/email/email-block-builder'
import type { AdminEmailDraftWorkspaceState } from '@/components/email/use-admin-email-draft-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@virtality/ui/components/card'
import { ArrowRight, Save } from 'lucide-react'

type ComposeStepProps = {
  workspace: AdminEmailDraftWorkspaceState
  onNext: () => void
}

export const ComposeStep = ({ workspace, onNext }: ComposeStepProps) => {
  const { form, patch, isDirty, readOnly, actions } = workspace

  return (
    <div className='space-y-4'>
      <Card>
        <CardContent className='space-y-4 pt-6'>
          <AdminEmailDraftContentFields
            subject={form.subject}
            previewText={form.previewText}
            disabled={readOnly}
            onChange={patch}
          />
          <div className='border-t' />
          <EmailBlockBuilder
            blocks={form.bodyBlocks}
            disabled={readOnly}
            onChange={(bodyBlocks) => patch({ bodyBlocks })}
          />
        </CardContent>
      </Card>
      <div className='flex justify-between'>
        {!readOnly ? (
          <Button
            type='button'
            variant='outline'
            onClick={() => void actions.saveDraft()}
            disabled={!isDirty || actions.isSavePending}
          >
            <Save className='mr-2 size-4' />
            {actions.isSavePending ? 'Saving…' : 'Save draft'}
          </Button>
        ) : (
          <span />
        )}
        <Button type='button' onClick={onNext}>
          Continue to targeting
          <ArrowRight className='ml-2 size-4' />
        </Button>
      </div>
    </div>
  )
}
