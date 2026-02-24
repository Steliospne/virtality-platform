'use client'
import useDevice, { useDeviceData } from '@/hooks/queries/use-device'

import { createContext, useContext, ReactNode } from 'react'

export type DeviceContextValue = useDeviceData

const DeviceContext = createContext<DeviceContextValue | null>(null)

interface DeviceContextProviderProps {
  children: ReactNode
}

export const DeviceContextProvider = ({
  children,
}: DeviceContextProviderProps) => {
  const deviceList = useDevice()

  return (
    <DeviceContext.Provider value={deviceList}>
      {children}
    </DeviceContext.Provider>
  )
}

export const useDeviceContext = (): DeviceContextValue => {
  const ctx = useContext(DeviceContext)
  if (!ctx)
    throw new Error('useDevice must be used within DeviceContextProvider')
  return ctx
}

export const useDeviceContextOptional = (): DeviceContextValue | null => {
  return useContext(DeviceContext)
}

export default DeviceContextProvider
