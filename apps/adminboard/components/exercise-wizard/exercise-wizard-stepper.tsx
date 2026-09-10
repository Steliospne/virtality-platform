'use client'

import { cn } from '@/lib/utils'
import {
  EXERCISE_WIZARD_STEPS,
  EXERCISE_WIZARD_STEP_LABELS,
  type ExerciseWizardStep,
} from '@/lib/exercise-wizard-steps'

type ExerciseWizardStepperProps = {
  currentStep: ExerciseWizardStep
  canJumpToStep: (step: ExerciseWizardStep) => boolean
  onStepClick: (step: ExerciseWizardStep) => void
}

export function ExerciseWizardStepper({
  currentStep,
  canJumpToStep,
  onStepClick,
}: ExerciseWizardStepperProps) {
  return (
    <nav aria-label='Exercise creation steps' className='px-8 pt-6'>
      <ol className='flex flex-wrap gap-2'>
        {EXERCISE_WIZARD_STEPS.map((step) => {
          const isCurrent = step === currentStep
          const isClickable = canJumpToStep(step)
          const label = EXERCISE_WIZARD_STEP_LABELS[step]

          return (
            <li key={step}>
              <button
                type='button'
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) {
                    onStepClick(step)
                  }
                }}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                  isClickable && !isCurrent
                    ? 'hover:bg-accent cursor-pointer'
                    : 'cursor-default opacity-60',
                )}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
