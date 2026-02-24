'use client'

import { authClient } from '@/auth-client'
import { UserLocalData } from '@/types/models'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRow } from 'tinybase/ui-react'

type TourState = {
  run: boolean
  isDropdownOpen: boolean
  stepIndex: number
  activeTour: boolean
  mission: {
    device: boolean
    patient: boolean
    program: boolean
  }
}

const defaultState: TourState = {
  run: false,
  isDropdownOpen: false,
  stepIndex: 0,
  activeTour: false,
  mission: {
    device: false,
    patient: false,
    program: false,
  },
}

const TourContext = createContext<{
  state: TourState
  setState: Dispatch<SetStateAction<TourState>>
}>({
  state: defaultState,
  setState: () => {},
})

export const useTour = () => useContext(TourContext)

const TourProvider = ({ children }: { children: ReactNode }) => {
  const { data } = authClient.useSession()
  const user = data?.user
  const [state, setState] = useState(defaultState)
  const userRow = useRow('users', user?.id ?? '') as UserLocalData // replace with dynamic ID if needed

  useEffect(() => {
    if (userRow) {
      setState((prev) => ({
        ...prev,
        mission: {
          device: userRow.device ?? false,
          patient: userRow.patient ?? false,
          program: userRow.program ?? false,
        },
      }))
    }
  }, [userRow])

  useEffect(() => {
    document.body.style.overflow = state.activeTour ? 'hidden' : 'auto'
  }, [state.activeTour])

  return <TourContext value={{ state, setState }}>{children}</TourContext>
}

export default TourProvider
