import { columns } from '@/app/(pages)/patient/patient-programs/_components/columns'
import { ProgramsTable } from '@/app/(pages)/patient/patient-programs/_components/programs-table'

const ProgramsPage = async (
  props: PageProps<'/patients/[patientId]/programs'>,
) => {
  const { patientId } = await props.params

  return <ProgramsTable patientId={patientId} columns={columns} />
}

export default ProgramsPage
