import { columns } from './_components/columns'
import { ProgramsTable } from './_components/programs-table'

const ProgramsPage = async (props: {
  params: Promise<{ patientId: string }>
}) => {
  const { patientId } = await props.params

  return <ProgramsTable patientId={patientId} columns={columns} />
}

export default ProgramsPage
