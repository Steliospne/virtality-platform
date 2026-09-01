'use client'

import { useEffect, useReducer } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getQueryClient, useORPC } from '@virtality/react-query'
import { useStore } from 'tinybase/ui-react'
import { VRDevice } from '@/types/models'

type PairingState = {
  status: 'paired' | 'pairing' | 'unpaired'
  isCodeFieldOpen: boolean
  verificationCode: string
  attemptId: string
  expiresAt: string
  error: string
}

const initialState: PairingState = {
  status: 'unpaired',
  isCodeFieldOpen: false,
  verificationCode: '',
  attemptId: '',
  expiresAt: '',
  error: '',
}

type Action =
  | { type: 'restore'; payload: PairingState }
  | { type: 'update'; payload: Partial<PairingState> }
  | { type: 'reset' }

const stateReducer = (state: PairingState, action: Action): PairingState => {
  switch (action.type) {
    case 'restore':
      return action.payload
    case 'update':
      return { ...state, ...action.payload }
    case 'reset':
      return initialState
    default:
      return state
  }
}

const storageKey = (deviceRecordId: string) =>
  `device-pairing:${deviceRecordId}`

function readStoredPairing(deviceRecordId: string): PairingState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(deviceRecordId))
    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<PairingState>
    if (
      stored.status !== 'pairing' ||
      typeof stored.attemptId !== 'string' ||
      typeof stored.verificationCode !== 'string' ||
      typeof stored.expiresAt !== 'string'
    ) {
      sessionStorage.removeItem(storageKey(deviceRecordId))
      return null
    }

    return {
      ...initialState,
      ...stored,
      isCodeFieldOpen: true,
      error: '',
    }
  } catch {
    sessionStorage.removeItem(storageKey(deviceRecordId))
    return null
  }
}

function writeStoredPairing(deviceRecordId: string, state: PairingState) {
  sessionStorage.setItem(storageKey(deviceRecordId), JSON.stringify(state))
}

function clearStoredPairing(deviceRecordId: string) {
  sessionStorage.removeItem(storageKey(deviceRecordId))
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

const useDeviceCardState = ({ device }: { device: VRDevice }) => {
  const [state, dispatch] = useReducer(stateReducer, initialState)
  const orpc = useORPC()
  const queryClient = getQueryClient()
  const store = useStore()

  const startMutation = useMutation(orpc.devicePairing.start.mutationOptions())
  const cancelMutation = useMutation(
    orpc.devicePairing.cancel.mutationOptions(),
  )

  const statusOptions = orpc.devicePairing.status.queryOptions({
    input: { attemptId: state.attemptId },
  })
  const statusQuery = useQuery({
    ...statusOptions,
    enabled: state.status === 'pairing' && Boolean(state.attemptId),
    refetchInterval: (query) =>
      !query.state.data || query.state.data.state === 'pending' ? 2000 : false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (device.data.deviceId) {
      clearStoredPairing(device.data.id)
      dispatch({
        type: 'update',
        payload: {
          status: 'paired',
          isCodeFieldOpen: false,
          error: '',
        },
      })
      return
    }

    const stored = readStoredPairing(device.data.id)
    if (stored) dispatch({ type: 'restore', payload: stored })
  }, [device.data.deviceId, device.data.id])

  useEffect(() => {
    const pairingStatus = statusQuery.data?.state
    if (
      state.status !== 'pairing' ||
      !pairingStatus ||
      pairingStatus === 'pending'
    )
      return

    clearStoredPairing(device.data.id)

    if (pairingStatus === 'completed') {
      dispatch({
        type: 'update',
        payload: {
          status: 'paired',
          isCodeFieldOpen: false,
          error: '',
        },
      })
      store?.setValue('lastPairedDeviceId', device.data.id)
      void queryClient.invalidateQueries({ queryKey: orpc.device.list.key() })
      return
    }

    const terminalMessage =
      pairingStatus === 'expired'
        ? 'Pairing code expired. Please generate a new code.'
        : pairingStatus === 'superseded'
          ? 'This pairing attempt was replaced or could not be completed.'
          : 'Pairing was cancelled.'

    dispatch({
      type: 'update',
      payload: {
        status: 'unpaired',
        isCodeFieldOpen: false,
        verificationCode: '',
        attemptId: '',
        expiresAt: '',
        error: terminalMessage,
      },
    })
  }, [
    device.data.id,
    orpc.device.list,
    queryClient,
    state.status,
    statusQuery.data?.state,
    store,
  ])

  useEffect(() => {
    if (!statusQuery.error || state.status !== 'pairing') return
    dispatch({
      type: 'update',
      payload: {
        error: 'Unable to refresh pairing status. Retrying automatically.',
      },
    })
  }, [state.status, statusQuery.error])

  const startPairing = async () => {
    dispatch({
      type: 'update',
      payload: {
        status: 'pairing',
        isCodeFieldOpen: false,
        error: '',
      },
    })

    try {
      const result = await startMutation.mutateAsync({
        deviceRecordId: device.data.id,
      })
      const nextState: PairingState = {
        status: 'pairing',
        isCodeFieldOpen: true,
        verificationCode: result.code,
        attemptId: result.attemptId,
        expiresAt: result.expiresAt.toISOString(),
        error: '',
      }

      writeStoredPairing(device.data.id, nextState)
      dispatch({ type: 'restore', payload: nextState })
    } catch (error) {
      clearStoredPairing(device.data.id)
      dispatch({
        type: 'update',
        payload: {
          status: 'unpaired',
          isCodeFieldOpen: false,
          error: errorMessage(
            error,
            'Unable to start pairing. Please try again.',
          ),
        },
      })
    }
  }

  const cancelPairing = async () => {
    const attemptId = state.attemptId
    clearStoredPairing(device.data.id)
    dispatch({ type: 'reset' })

    if (!attemptId) return

    try {
      await cancelMutation.mutateAsync({ attemptId })
    } catch (error) {
      dispatch({
        type: 'update',
        payload: {
          error: errorMessage(
            error,
            'Unable to cancel pairing. The code will expire automatically.',
          ),
        },
      })
    }
  }

  const resetState = () => {
    clearStoredPairing(device.data.id)
    dispatch({ type: 'reset' })
  }

  return {
    state,
    isStarting: startMutation.isPending,
    isCancelling: cancelMutation.isPending,
    handler: { startPairing, cancelPairing, resetState },
  }
}

export default useDeviceCardState
