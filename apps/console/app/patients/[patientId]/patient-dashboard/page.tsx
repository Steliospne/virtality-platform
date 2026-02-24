import PatientDashboard from '@/app/(pages)/patient/patient-dashboard'
import { PatientDashboardProvider } from '@/context/patient-dashboard-context'
import { DeviceContextProvider } from '@/context/device-context'

const PatientDashboardPage = async (
  props: PageProps<'/patients/[patientId]/patient-dashboard'>,
) => {
  const { patientId } = await props.params

  return (
    <DeviceContextProvider>
      <PatientDashboardProvider patientId={patientId}>
        <PatientDashboard />
      </PatientDashboardProvider>
    </DeviceContextProvider>
  )
}

export default PatientDashboardPage
