'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useFrame } from '@react-three/fiber'
import { Timer } from 'three'

const CheckoutSuccessTimerContext = createContext<Timer | null>(null)

/**
 * Owns a THREE.Timer for the celebration scene. R3F 9 still constructs a
 * deprecated THREE.Clock internally; our animations read this Timer instead.
 */
export function CheckoutSuccessTimerProvider({
  children,
}: {
  children: ReactNode
}) {
  const timer = useMemo(() => new Timer(), [])

  useEffect(() => {
    timer.connect(document)
    return () => {
      timer.disconnect()
      timer.dispose()
    }
  }, [timer])

  // Run before other celebration useFrame callbacks so getElapsed() is fresh.
  useFrame(() => {
    timer.update()
  }, -1)

  return (
    <CheckoutSuccessTimerContext.Provider value={timer}>
      {children}
    </CheckoutSuccessTimerContext.Provider>
  )
}

export function useCheckoutSuccessTimer(): Timer {
  const timer = useContext(CheckoutSuccessTimerContext)
  if (!timer) {
    throw new Error(
      'useCheckoutSuccessTimer requires CheckoutSuccessTimerProvider',
    )
  }
  return timer
}
