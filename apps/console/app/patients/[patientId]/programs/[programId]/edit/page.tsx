import ProgramEditForm from '@/app/(pages)/patient/patient-programs/program-edit-form'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'

const EditProgramFormPage = async (
  props: PageProps<'/patients/[patientId]/programs/[programId]/edit'>,
) => {
  const { patientId, programId } = await props.params

  return (
    <ExerciseLibraryProvider>
      <ProgramEditForm patientId={patientId} programId={programId} />
    </ExerciseLibraryProvider>
  )
}

export default EditProgramFormPage
