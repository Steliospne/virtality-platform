import PatientDashboard from './_components/patient-dashboard'
import { PatientDashboardProvider } from '@/context/patient-dashboard-context'
import { DeviceContextProvider } from '@/context/device-context'

const PatientDashboardPage = async (props: {
  params: Promise<{ patientId: string }>
}) => {
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
