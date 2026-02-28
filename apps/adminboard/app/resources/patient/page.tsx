import { getQueryClient } from '@/react-query'
import Boundary from '@/components/shared/hydration-boundary'
import { getPatients } from '@/data/server/patient'
import PatientTableDAL from '@/components/resources/patients/patient-table'

const PatientPage = async () => {
  const queryClient = getQueryClient()
  queryClient.prefetchQuery({ queryKey: ['patients'], queryFn: getPatients })

  return (
    <Boundary client={queryClient}>
      <PatientTableDAL />;
    </Boundary>
  )
}

export default PatientPage
