'use client'

import { ExerciseWizardIssueList } from '@/components/exercise-wizard/exercise-wizard-issue-list'
import { Button } from '@/components/ui/button'
import { EXERCISE_WIZARD_LATERALITY_OPTIONS } from '@/lib/exercise-wizard-constants'
import type { ExerciseWizardStep } from '@/lib/exercise-wizard-steps'
import type { ExerciseDraftFields } from '@virtality/shared/types'
import type { ReactNode } from 'react'
import {
  deriveExerciseIdsFromDraft,
  deriveExerciseNamesFromDraft,
} from '@virtality/shared/utils'

const REVIEW_EMPTY_VALUE = 'Not set'

function reviewText(value: string): string {
  return value.trim() ? value : REVIEW_EMPTY_VALUE
}

type ExerciseWizardReviewStepProps = {
  draft: ExerciseDraftFields
  issues: string[]
  onEditStep: (step: ExerciseWizardStep) => void
}

export function ExerciseWizardReviewStep({
  draft,
  issues,
  onEditStep,
}: ExerciseWizardReviewStepProps) {
  const lateralityLabel =
    EXERCISE_WIZARD_LATERALITY_OPTIONS.find(
      (option) => option.value === draft.laterality,
    )?.label ?? 'Not set'
  const unityNames = deriveExerciseNamesFromDraft(draft).map(
    (entry) => entry.name,
  )
  const exerciseIds = deriveExerciseIdsFromDraft(draft)

  return (
    <div className='flex max-w-2xl flex-col gap-6'>
      <ReviewSection title='Identity' onEdit={() => onEditStep('identity')}>
        <ReviewRow label='Laterality' value={lateralityLabel} />
        <ReviewRow label='Display name' value={reviewText(draft.displayName)} />
        <ReviewRow
          label='Exercise ID(s)'
          value={
            exerciseIds.length > 0 ? exerciseIds.join(', ') : REVIEW_EMPTY_VALUE
          }
        />
        <ReviewRow
          label='Unity key(s)'
          value={
            unityNames.length > 0 ? unityNames.join(', ') : REVIEW_EMPTY_VALUE
          }
        />
        <ReviewRow label='Description' value={reviewText(draft.description)} />
      </ReviewSection>

      <ReviewSection
        title='Classification'
        onEdit={() => onEditStep('classification')}
      >
        <ReviewRow label='Category' value={reviewText(draft.category)} />
        <ReviewRow label='Item' value={draft.item?.trim() || 'None'} />
      </ReviewSection>

      <ReviewSection title='Media' onEdit={() => onEditStep('media')}>
        <ReviewRow label='Image' value={draft.image ? 'Attached' : 'Missing'} />
        <ReviewRow label='Video' value={draft.video ? 'Attached' : 'Missing'} />
      </ReviewSection>

      <ExerciseWizardIssueList
        title='Fix these before enabling in Console:'
        issues={issues}
      />
    </div>
  )
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className='rounded-lg border p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='font-medium'>{title}</h2>
        <Button type='button' variant='outline' size='sm' onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className='flex flex-col gap-2'>{children}</dl>
    </section>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-1 sm:grid-cols-[8rem_1fr]'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='text-sm'>{value}</dd>
    </div>
  )
}
