'use client'

import { CONNECTION_EVENT } from '@virtality/shared/types'
import { VRDevice } from '@/types/models'
import { useEffect, useState } from 'react'

type ConnectOptions = {
  timeoutMs?: number
}

export type SocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
  | 'connected'
  | 'failed'

type ConnectionMeta = {
  state: SocketConnectionState
  attempt: number
  error: string | null
}

const DEFAULT_CONNECT_TIMEOUT_MS = 10_000
const inflightConnections = new WeakMap<VRDevice['socket'], Promise<void>>()

const initialState: ConnectionMeta = {
  state: 'disconnected',
  attempt: 0,
  error: null,
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

interface useSocketConnectionProps {
  device?: VRDevice | null
}

const useSocketConnection = ({ device }: useSocketConnectionProps) => {
  const [meta, setMeta] = useState<ConnectionMeta>(initialState)

  const connect = async (options?: ConnectOptions) => {
    if (!device) return
    const socket = device.socket

    if (socket.connected) return
    const existing = inflightConnections.get(socket)
    if (existing) return existing

    setMeta({ state: 'connecting', attempt: 0, error: null })

    const connectPromise = (async () => {
      await new Promise<void>((resolve, reject) => {
        const timeoutMs = options?.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS

        const cleanup = () => {
          socket.off('connect', onConnect)
          socket.io.off('reconnect_failed', onReconnectFailed)
          socket.off(CONNECTION_EVENT.ERROR, onConnectionError)
          clearTimeout(timeout)
        }

        const onConnect = () => {
          cleanup()
          resolve()
        }

        const onReconnectFailed = () => {
          cleanup()
          reject(new Error('Connection failed after retry limit.'))
        }

        const onConnectionError = (payload: unknown) => {
          cleanup()
          reject(
            new Error(
              toErrorMessage(
                payload,
                'Socket connection was rejected by server.',
              ),
            ),
          )
        }

        const timeout = setTimeout(() => {
          cleanup()
          socket.disconnect()
          reject(new Error('Connection timed out. Please retry.'))
        }, timeoutMs)

        socket.on('connect', onConnect)
        socket.io.on('reconnect_failed', onReconnectFailed)
        socket.on(CONNECTION_EVENT.ERROR, onConnectionError)
        socket.connect()
      })
    })()

    inflightConnections.set(socket, connectPromise)
    try {
      await connectPromise
    } finally {
      inflightConnections.delete(socket)
    }
  }

  const disconnect = () => {
    if (!device) return
    device.socket.disconnect()
    setMeta(initialState)
  }

  useEffect(() => {
    if (!device) {
      setMeta(initialState)
      return
    }

    const onConnect = () => {
      setMeta({ state: 'connected', attempt: 0, error: null })
    }

    const onDisconnect = () => {
      setMeta((prev) =>
        prev.state === 'failed'
          ? prev
          : { state: 'disconnected', attempt: 0, error: null },
      )
    }

    const onReconnectAttempt = (attempt: number) => {
      setMeta({ state: 'reconnecting', attempt, error: null })
    }

    const onReconnectFailed = () => {
      setMeta({
        state: 'failed',
        attempt: 0,
        error: 'Connection failed after retry limit.',
      })
    }

    const onConnectError = (error: unknown) => {
      const message = toErrorMessage(error, 'Unable to connect.')
      setMeta((prev) => ({
        state: prev.state === 'reconnecting' ? 'reconnecting' : 'connecting',
        attempt: prev.attempt,
        error: message,
      }))
    }

    const onConnectionError = (payload: unknown) => {
      setMeta({
        state: 'failed',
        attempt: 0,
        error: toErrorMessage(
          payload,
          'Socket connection was rejected by server.',
        ),
      })
    }

    if (device.socket.connected) onConnect()

    device.socket.on('connect', onConnect)
    device.socket.on('disconnect', onDisconnect)
    device.socket.io.on('reconnect_attempt', onReconnectAttempt)
    device.socket.io.on('reconnect_failed', onReconnectFailed)
    device.socket.on('connect_error', onConnectError)
    device.socket.on(CONNECTION_EVENT.ERROR, onConnectionError)

    return () => {
      device.socket.off('connect', onConnect)
      device.socket.off('disconnect', onDisconnect)
      device.socket.io.off('reconnect_attempt', onReconnectAttempt)
      device.socket.io.off('reconnect_failed', onReconnectFailed)
      device.socket.off('connect_error', onConnectError)
      device.socket.off(CONNECTION_EVENT.ERROR, onConnectionError)
    }
  }, [device])

  return {
    connected: meta.state === 'connected',
    connectionState: meta.state,
    reconnectAttempt: meta.attempt,
    connectionError: meta.error,
    connect,
    disconnect,
  }
}

export default useSocketConnection
