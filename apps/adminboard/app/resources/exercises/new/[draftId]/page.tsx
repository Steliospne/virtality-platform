import { ExerciseWizardWorkspace } from '@/components/exercise-wizard/exercise-wizard-workspace'

export const dynamic = 'force-dynamic'

type ExerciseWizardPageProps = {
  params: Promise<{ draftId: string }>
}

export default async function ExerciseWizardPage({
  params,
}: ExerciseWizardPageProps) {
  const { draftId } = await params
  return <ExerciseWizardWorkspace draftId={draftId} />
}
