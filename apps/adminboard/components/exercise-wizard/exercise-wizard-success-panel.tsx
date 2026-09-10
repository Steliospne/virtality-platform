'use client'

import { Button } from '@/components/ui/button'

type ExerciseWizardSuccessPanelProps = {
  displayName: string
  rowCount: number
  onCreateAnother: () => void
  onBackToExercises: () => void
}

export function ExerciseWizardSuccessPanel({
  displayName,
  rowCount,
  onCreateAnother,
  onBackToExercises,
}: ExerciseWizardSuccessPanelProps) {
  return (
    <div className='mx-auto flex max-w-lg flex-col gap-4 rounded-lg border p-8 text-center'>
      <h2 className='text-xl font-semibold'>Exercise enabled in Console</h2>
      <p className='text-muted-foreground text-sm'>
        Wrote {rowCount} enabled row{rowCount === 1 ? '' : 's'} for{' '}
        <span className='text-foreground font-medium'>{displayName}</span>.
      </p>
      <div className='flex flex-col gap-2 sm:flex-row sm:justify-center'>
        <Button type='button' onClick={onCreateAnother}>
          Create another
        </Button>
        <Button type='button' variant='outline' onClick={onBackToExercises}>
          Back to exercises
        </Button>
      </div>
    </div>
  )
}
