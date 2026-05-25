import ProgramEditForm from './_components/program-edit-form'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'

const EditProgramFormPage = async (props: {
  params: Promise<{ patientId: string; programId: string }>
}) => {
  const { patientId, programId } = await props.params

  return (
    <ExerciseLibraryProvider>
      <ProgramEditForm patientId={patientId} programId={programId} />
    </ExerciseLibraryProvider>
  )
}

export default EditProgramFormPage
