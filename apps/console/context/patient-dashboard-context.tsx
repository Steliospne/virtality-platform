'use client'

import { createContext, useContext, ReactNode, RefObject, useRef } from 'react'
import usePatientDashboardState from '@/hooks/use-patient-dashboard-state'
import usePatientDashboardSocketSetup from '@/hooks/use-patient-dashboard-socket-setup'
import { useRow, useStore } from 'tinybase/ui-react'
import { PatientLocalData, ProgressDataPoint } from '@/types/models'
import { Store } from 'tinybase'
import usePlotData from '@/hooks/use-plot-data'

export type PatientDashboardValue = {
  state: ReturnType<typeof usePatientDashboardState>['state']
  handler: ReturnType<typeof usePatientDashboardState>['handler']
  patientSessionId: { current: string }
  store?: Store
  currExercise: RefObject<number>
  patientLocalData: PatientLocalData
  plotData: ProgressDataPoint[]
  patientId: string
}

const PatientDashboardContext = createContext<PatientDashboardValue | null>(
  null,
)

interface PatientDashboardProviderProps {
  patientId: string
  children: ReactNode
}

export const PatientDashboardProvider = ({
  patientId,
  children,
}: PatientDashboardProviderProps) => {
  const store = useStore()
  const currExercise = useRef(0)
  const patientLocalData = useRow('patients', patientId) as PatientLocalData
  const { state, handler } = usePatientDashboardState({
    patientId,
    patientLocalData,
  })
  const plot = usePlotData()
  const patientSessionId = usePatientDashboardSocketSetup({
    state,
    handler,
    patientId,
    store,
    currExercise,
    patientLocalData,
    plot,
  })

  const { plotData } = plot.state

  return (
    <PatientDashboardContext.Provider
      value={{
        state,
        handler,
        patientId,
        patientSessionId,
        store,
        currExercise,
        patientLocalData,
        plotData,
      }}
    >
      {children}
    </PatientDashboardContext.Provider>
  )
}

export const usePatientDashboard = (): PatientDashboardValue => {
  const ctx = useContext(PatientDashboardContext)
  if (!ctx)
    throw new Error(
      'usePatientDashboard must be used within PatientDashboardProvider',
    )
  return ctx
}

export const usePatientDashboardOptional = (): PatientDashboardValue | null => {
  return useContext(PatientDashboardContext)
}

export default PatientDashboardContext
