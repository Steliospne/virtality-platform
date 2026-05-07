'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { PatientsPerDocChart } from '@/components/dashboard/patients-per-doc-chart'
import { SessionsPerPatientChart } from '@/components/dashboard/sessions-per-patient-chart'
import { SessionsPerWeekChart } from '@/components/dashboard/sessions-per-week-chart'
import {
  useTotalPatientSessions,
  useUniquePatientsPerPhysio,
  useSessionsPerPatient,
  useTotalUniquePatients,
} from '@virtality/react-query'

const StartPage = () => {
  const { data: totalPatients, isLoading: isLoadingTotalPatients } =
    useTotalUniquePatients()
  const {
    data: totalPatientSessions,
    isLoading: isLoadingTotalPatientSessions,
  } = useTotalPatientSessions()
  const { data: patientsPerDoc, isLoading: isLoadingPatientsPerDoc } =
    useUniquePatientsPerPhysio()
  const { data: sessionsPerPatient, isLoading: isLoadingSessionsPerPatient } =
    useSessionsPerPatient()

  if (
    isLoadingTotalPatients ||
    isLoadingTotalPatientSessions ||
    isLoadingPatientsPerDoc ||
    isLoadingSessionsPerPatient
  ) {
    return <div>Loading...</div>
  }

  return (
    <div className='min-h-screen-with-header mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8'>
      <div className='flex items-end justify-between gap-6'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
            Dashboard
          </h1>
          <p className='text-muted-foreground mt-2 text-sm'>
            Clear overview of patient volume and session activity.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid gap-4 md:grid-cols-2'>
        <StatCard
          title='Total Unique Patients'
          value={totalPatients ?? 0}
          description='Total number of unique patients in the system'
          tone='blue'
        />
        <StatCard
          title='Total Patient Sessions'
          value={totalPatientSessions ?? 0}
          description='Total number of patient sessions recorded'
          tone='teal'
        />
      </div>

      <div className='grid gap-6'>
        {/* Patients per Doctor Chart */}
        <PatientsPerDocChart data={patientsPerDoc ?? []} />

        {/* Sessions Distribution Chart */}
        <SessionsPerPatientChart data={sessionsPerPatient ?? []} />

        {/* Sessions per Week Chart */}
        <SessionsPerWeekChart />
      </div>
    </div>
  )
}

export default StartPage
