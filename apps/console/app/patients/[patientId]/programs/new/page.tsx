import ProgramForm from '@/app/(pages)/patient/patient-programs/program-form'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'

const CreateProgramFormPage = async (
  props: PageProps<'/patients/[patientId]/programs/new'>,
) => {
  const { patientId } = await props.params

  return (
    <ExerciseLibraryProvider>
      <ProgramForm patientId={patientId} />
    </ExerciseLibraryProvider>
  )
}

export default CreateProgramFormPage
