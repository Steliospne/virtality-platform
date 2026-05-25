import PatientFormEdit from './_components/patient-form-edit'

const PatientProfilePage = async (props: {
  params: Promise<{ patientId: string }>
}) => {
  const { patientId } = await props.params

  return <PatientFormEdit patientId={patientId} />
}

export default PatientProfilePage
