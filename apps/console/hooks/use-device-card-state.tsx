import { useEffect, useReducer, useRef } from 'react'
import { progressiveRetry } from '@/lib/utils'
import { VRDevice } from '@/types/models'
import { useRow, useStore } from 'tinybase/ui-react'
import useResetDeviceId from './mutations/device/use-reset-device-id'
import { orpc } from '@/integrations/orpc/client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'

type State = {
  status: 'paired' | 'pairing' | 'unpaired'
  isCodeFieldOpen: boolean
  isRePairDialogOpen: boolean
  verificationCode: string
  error: string
}

const initialState: State = {
  status: 'unpaired',
  isCodeFieldOpen: false,
  isRePairDialogOpen: false,
  verificationCode: '',
  error: '',
}

type Action =
  | { type: 'setStatus'; payload: State['status'] }
  | { type: 'setRePairDialogOpen'; payload: State['isRePairDialogOpen'] }
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
    case 'setRePairDialogOpen':
      return { ...state, isRePairDialogOpen: action.payload }
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
  connected: boolean
}

const useDeviceCardState = ({ device, connected }: useDeviceCardStateProps) => {
  const { queryClient } = getQueryClient()
  const store = useStore()
  const [state, dispatch] = useReducer(stateReducer, initialState)
  const socket = device.socket

  const devicesLocalData = useRow('devices', device.data.id) as State & {
    expirationTimestamp: number
  }

  const hasStartedPairing = useRef(false)
  const { mutate: resetDeviceId } = useResetDeviceId({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.device.list.key(),
      })
    },
  })

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
        socket.io.opts.query.roomCode = code
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
      if (device.data.deviceId)
        socket.io.opts.query.roomCode = device.data.deviceId
      socket.connect()
    }
  }

  const startPairing = async () => {
    if (device.data.deviceId)
      return dispatch({
        type: 'setRePairDialogOpen',
        payload: !state.isRePairDialogOpen,
      })

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

  const resetPairing = async () => {
    setRePairDialogOpen()
    resetDeviceId({ id: device.data.id })
    device.data.deviceId = null

    await startPairing()
  }

  const cancelPairing = () => {
    socket.disconnect()
    dispatch({ type: 'resetState' })
    hasStartedPairing.current = false
    store?.delRow('devices', device.data.id)
  }

  const setRePairDialogOpen = () =>
    dispatch({
      type: 'setRePairDialogOpen',
      payload: !state.isRePairDialogOpen,
    })

  const setDeviceStatus = (payload: State['status']) => {
    dispatch({ type: 'setStatus', payload })
  }

  const resetState = () => dispatch({ type: 'resetState' })

  const updateDeviceCardState = (payload: Partial<State>) => {
    return dispatch({ type: 'updateDeviceCardState', payload })
  }

  return {
    state,
    dispatch,
    handler: {
      VRConnection,
      setRePairDialogOpen,
      startPairing,
      resetPairing,
      cancelPairing,
      setDeviceStatus,
      resetState,
      updateDeviceCardState,
    },
  }
}

export default useDeviceCardState
