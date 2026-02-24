import PatientFormEdit from '@/app/(pages)/patient/patient-profile/patient-form-edit'

const PatientProfilePage = async (
  props: PageProps<'/patients/[patientId]/profile'>,
) => {
  const { patientId } = await props.params

  return <PatientFormEdit patientId={patientId} />
}

export default PatientProfilePage
