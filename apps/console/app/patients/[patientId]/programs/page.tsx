import { columns } from './_components/columns'
import { ProgramsTable } from './_components/programs-table'

const ProgramsPage = async (
  props: PageProps<'/patients/[patientId]/programs'>,
) => {
  const { patientId } = await props.params

  return <ProgramsTable patientId={patientId} columns={columns} />
}

export default ProgramsPage
