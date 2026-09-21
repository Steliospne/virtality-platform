'use client'

import { AdminEmailDraftDialogs } from '@/components/email/admin-email-draft-dialogs'
import type { DraftWorkspaceData } from '@/components/email/use-admin-email-draft-actions'
import {
  useAdminEmailDraftWorkspace,
  type DraftWorkspaceCallbacks,
} from '@/components/email/use-admin-email-draft-workspace'
import { Button } from '@/components/ui/button'
import { getAdminEmailTopicLabel } from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Archive, ArrowLeft, Copy, Eye, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ComposeStep } from './compose-step'
import { ReviewStep } from './review-step'
import { StepBar, type DraftStep } from './step-bar'
import { TargetStep } from './target-step'

type DraftStepperProps = DraftWorkspaceCallbacks & {
  draft: DraftWorkspaceData
  isArchived: boolean
  onBack: () => void
}

export const DraftStepper = ({
  draft,
  isArchived,
  onBack,
  ...callbacks
}: DraftStepperProps) => {
  const workspace = useAdminEmailDraftWorkspace({
    draft,
    isArchived,
    ...callbacks,
  })
  const { form, isDirty, actions } = workspace
  const [step, setStep] = useState<DraftStep>('compose')

  /** Review reads saved state, so entering it saves first. */
  const goTo = async (next: DraftStep) => {
    if (next === 'review' && isDirty) {
      const saved = await actions.saveDraft()
      if (!saved) {
        return
      }
    }
    setStep(next)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button type='button' variant='ghost' size='sm' onClick={onBack}>
          <ArrowLeft className='mr-1.5 size-4' />
          Emails
        </Button>
        <p className='min-w-0 flex-1 truncate font-medium'>
          {form.subject.trim() || 'Untitled draft'}
        </p>
        <Badge variant='secondary'>{getAdminEmailTopicLabel(form.topic)}</Badge>
        {isArchived ? <Badge variant='outline'>Archived</Badge> : null}
        {draft.isFinalSent ? <Badge variant='outline'>Final sent</Badge> : null}
        <span className='text-muted-foreground text-xs'>
          {actions.isSavePending
            ? 'Saving…'
            : isDirty
              ? 'Unsaved changes'
              : 'Saved'}
        </span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => void workspace.preview.openPreview()}
        >
          <Eye className='mr-1.5 size-4' />
          Preview
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={actions.isClonePending}
          onClick={() => void actions.clone()}
        >
          <Copy className='mr-1.5 size-4' />
          Clone
        </Button>
        {isArchived ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={actions.isRestorePending}
            onClick={() => void actions.restore()}
          >
            <RotateCcw className='mr-1.5 size-4' />
            Restore
          </Button>
        ) : draft.isFinalSent ? null : (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => workspace.archive.setOpen(true)}
          >
            <Archive className='mr-1.5 size-4' />
            Archive
          </Button>
        )}
      </div>

      <StepBar
        current={step}
        onSelect={(next) => void goTo(next)}
        blockCount={form.bodyBlocks.length}
        sendReady={draft.sendReadiness.ready}
      />

      {step === 'compose' ? (
        <ComposeStep workspace={workspace} onNext={() => void goTo('target')} />
      ) : step === 'target' ? (
        <TargetStep
          workspace={workspace}
          onBack={() => setStep('compose')}
          onNext={() => void goTo('review')}
        />
      ) : (
        <ReviewStep workspace={workspace} onBack={() => setStep('target')} />
      )}

      <AdminEmailDraftDialogs workspace={workspace} />
    </div>
  )
}
