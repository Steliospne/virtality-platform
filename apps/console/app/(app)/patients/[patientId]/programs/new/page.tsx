import ProgramForm from './_components/program-form'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'

const CreateProgramFormPage = async (props: {
  params: Promise<{ patientId: string }>
}) => {
  const { patientId } = await props.params

  return (
    <ExerciseLibraryProvider>
      <ProgramForm patientId={patientId} />
    </ExerciseLibraryProvider>
  )
}

export default CreateProgramFormPage
