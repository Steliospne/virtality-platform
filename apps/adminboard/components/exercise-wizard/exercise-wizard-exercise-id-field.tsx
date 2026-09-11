'use client'

import { ExerciseWizardFieldError } from '@/components/exercise-wizard/exercise-wizard-field-error'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'

type ExerciseWizardExerciseIdFieldProps = {
  value: string
  error: string | undefined
  previewIds: string[]
  onChange: (exerciseId: string) => void
}

export function ExerciseWizardExerciseIdField({
  value,
  error,
  previewIds,
  onChange,
}: ExerciseWizardExerciseIdFieldProps) {
  const hint =
    previewIds.length > 0
      ? `Exercise row ID(s): ${previewIds.join(', ')}`
      : 'Exercise row ID as a number. A pair also takes the next number.'

  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor='exercise-id'>Exercise ID</Label>
      <Input
        id='exercise-id'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode='numeric'
        placeholder='e.g. 420'
        aria-invalid={error ? true : undefined}
      />
      <ExerciseWizardFieldError message={error} hint={hint} />
    </div>
  )
}
