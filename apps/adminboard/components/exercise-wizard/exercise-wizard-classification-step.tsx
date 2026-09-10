'use client'

import { ExerciseWizardVocabularyField } from '@/components/exercise-wizard/exercise-wizard-vocabulary-field'

type ExerciseWizardClassificationStepProps = {
  category: string
  item: string | null
  categories: string[]
  items: string[]
  onChange: (patch: { category?: string; item?: string | null }) => void
}

export function ExerciseWizardClassificationStep({
  category,
  item,
  categories,
  items,
  onChange,
}: ExerciseWizardClassificationStepProps) {
  return (
    <div className='flex max-w-2xl flex-col gap-6'>
      <ExerciseWizardVocabularyField
        label='Category'
        value={category}
        options={categories}
        placeholder='Select category'
        onChange={(next) => onChange({ category: next })}
      />
      <ExerciseWizardVocabularyField
        label='Item (equipment)'
        value={item ?? ''}
        options={items}
        placeholder='Optional equipment'
        allowEmpty
        onChange={(next) => onChange({ item: next.trim() ? next : null })}
      />
    </div>
  )
}
