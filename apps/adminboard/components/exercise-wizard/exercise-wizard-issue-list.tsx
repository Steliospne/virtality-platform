'use client'

type ExerciseWizardIssueListProps = {
  title: string
  issues: string[]
}

export function ExerciseWizardIssueList({
  title,
  issues,
}: ExerciseWizardIssueListProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <div
      role='alert'
      className='border-destructive/40 bg-destructive/5 flex flex-col gap-2 rounded-lg border p-4'
    >
      <p className='text-destructive text-sm font-medium'>{title}</p>
      <ul className='text-destructive list-disc pl-5 text-sm'>
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  )
}
