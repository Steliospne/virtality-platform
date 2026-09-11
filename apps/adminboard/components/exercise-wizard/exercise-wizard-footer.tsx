'use client'

import { Button } from '@/components/ui/button'
import type { ExerciseWizardStep } from '@/lib/exercise-wizard-steps'

type ExerciseWizardFooterProps = {
  currentStep: ExerciseWizardStep
  showReviewActions: boolean
  isBusy: boolean
  onBack: () => void
  onNext: () => void
  onSaveDraft: () => void
  onEnable: () => void
}

export function ExerciseWizardFooter({
  currentStep,
  showReviewActions,
  isBusy,
  onBack,
  onNext,
  onSaveDraft,
  onEnable,
}: ExerciseWizardFooterProps) {
  const showBack = currentStep !== 'identity'

  return (
    <footer className='flex flex-wrap items-center gap-2 border-t px-8 py-4'>
      {showBack ? (
        <Button
          type='button'
          variant='outline'
          onClick={onBack}
          disabled={isBusy}
        >
          Back
        </Button>
      ) : null}
      <div className='ml-auto flex flex-wrap gap-2'>
        {showReviewActions ? (
          <>
            <Button
              type='button'
              variant='outline'
              onClick={onSaveDraft}
              disabled={isBusy}
            >
              Save as draft
            </Button>
            <Button type='button' onClick={onEnable} disabled={isBusy}>
              Enable in Console
            </Button>
          </>
        ) : (
          <Button type='button' onClick={onNext} disabled={isBusy}>
            Next
          </Button>
        )}
      </div>
    </footer>
  )
}
