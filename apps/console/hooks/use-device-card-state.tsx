import { useEffect, useReducer, useRef } from 'react'
import { progressiveRetry } from '@/lib/utils'
import { VRDevice } from '@/types/models'
import { useRow, useStore } from 'tinybase/ui-react'
import useSocketConnection from './use-socket-connection'

type State = {
  status: 'paired' | 'pairing' | 'unpaired'
  isCodeFieldOpen: boolean
  verificationCode: string
  error: string
}

const initialState: State = {
  status: 'unpaired',
  isCodeFieldOpen: false,
  verificationCode: '',
  error: '',
}

type Action =
  | { type: 'setStatus'; payload: State['status'] }
  | { type: 'setCodeFieldOpen'; payload: State['isCodeFieldOpen'] }
  | { type: 'setVerificationCode'; payload: State['verificationCode'] }
  | { type: 'setError'; payload: State['error'] }
  | { type: 'resetState' }
  | { type: 'restoreState'; payload: State }
  | { type: 'updateDeviceCardState'; payload: Partial<State> }

const stateReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'setStatus':
      return { ...state, status: action.payload }
    case 'setCodeFieldOpen':
      return { ...state, isCodeFieldOpen: action.payload }
    case 'setVerificationCode':
      return { ...state, verificationCode: action.payload }
    case 'setError':
      return { ...state, error: action.payload }
    case 'resetState':
      return { ...state, ...initialState }
    case 'restoreState':
      return { ...state, ...action.payload }
    case 'updateDeviceCardState':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

interface useDeviceCardStateProps {
  device: VRDevice
}

const useDeviceCardState = ({ device }: useDeviceCardStateProps) => {
  const store = useStore()
  const [state, dispatch] = useReducer(stateReducer, initialState)
  const socket = device.socket
  const { connected, connect } = useSocketConnection({ device })

  const devicesLocalData = useRow('devices', device.data.id) as State & {
    expirationTimestamp: number
  }

  const hasStartedPairing = useRef(false)

  useEffect(() => {
    if (device.data.deviceId) {
      dispatch({ type: 'setStatus', payload: 'paired' })
    }
  }, [device])

  const handleCodeGeneration = async () => {
    try {
      const code = await progressiveRetry()
      if (code) {
        dispatch({ type: 'setVerificationCode', payload: code })
        dispatch({ type: 'setCodeFieldOpen', payload: !state.isCodeFieldOpen })
        device.mutations.setDeviceRoomCode(code)
        return code
      }
    } catch (err) {
      const error = err as Error
      dispatch({ type: 'setError', payload: error.message })
      throw new Error('Failed to generate code.', error)
    }
  }

  const VRConnection = async () => {
    if (!connected) {
      if (device.data.deviceId) {
        device.mutations.setDeviceRoomCode(device.data.deviceId)
      }

      try {
        await connect({ timeoutMs: 10_000 })
      } catch (error) {
        dispatch({
          type: 'setError',
          payload:
            error instanceof Error
              ? error.message
              : 'Unable to connect to socket server.',
        })
        throw error
      }
    }
  }

  const startPairing = async () => {
    try {
      dispatch({ type: 'setStatus', payload: 'pairing' })
      const code = await handleCodeGeneration()
      await VRConnection()

      store?.setRow('devices', device.data.id, {
        ...devicesLocalData,
        ...state,
        status: 'pairing',
        verificationCode: code ?? '',
        isCodeFieldOpen: true,
        expirationTimestamp: Date.now(),
      })

      hasStartedPairing.current = true
    } catch (err) {
      const error = err as Error

      console.log('Failed because: ', error)
    }
  }

  const cancelPairing = () => {
    socket.disconnect()
    dispatch({ type: 'resetState' })
    hasStartedPairing.current = false
    store?.delRow('devices', device.data.id)
  }

  const resetState = () => dispatch({ type: 'resetState' })

  const updateDeviceCardState = (payload: Partial<State>) => {
    return dispatch({ type: 'updateDeviceCardState', payload })
  }

  return {
    state,
    handler: {
      startPairing,
      cancelPairing,
      resetState,
      updateDeviceCardState,
    },
  }
}

export default useDeviceCardState
