type ExerciseWizardPageHeadingProps = {
  title: string
}

export function ExerciseWizardPageHeading({
  title,
}: ExerciseWizardPageHeadingProps) {
  return (
    <header className='border-b px-8 py-6'>
      <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
    </header>
  )
}
