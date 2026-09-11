'use client'

type ExerciseWizardFieldErrorProps = {
  message: string | undefined
  hint?: string
}

export function ExerciseWizardFieldError({
  message,
  hint,
}: ExerciseWizardFieldErrorProps) {
  if (message) {
    return (
      <p className='text-destructive text-xs' role='alert'>
        {message}
      </p>
    )
  }

  if (!hint) {
    return null
  }

  return <p className='text-muted-foreground text-xs'>{hint}</p>
}
