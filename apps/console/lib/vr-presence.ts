import { io, type Socket } from 'socket.io-client'
import {
  CONNECTION_EVENT,
  getSocketUrl,
  type VrPresenceResponse,
} from '@virtality/shared/types'

export const VR_PRESENCE_POLL_INTERVAL_MS = 5_000
export const VR_PRESENCE_QUERY_TIMEOUT_MS = 10_000

export {
  buildDevicePresenceById,
  getPairedDeviceRoomCodes,
  resolveDeviceVrPresenceStatus,
  type DeviceVrPresenceStatus,
} from './vr-presence-status'

export function createPresenceSocket(): Socket {
  return io(getSocketUrl(), {
    secure: true,
    autoConnect: false,
    query: {
      mode: 'presence',
    },
  })
}

export function ensurePresenceSocketConnected(socket: Socket): Promise<void> {
  if (socket.connected) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup()
      resolve()
    }
    const onConnectError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)
    socket.connect()
  })
}

export function queryVrPresence(
  socket: Socket,
  roomCodes: string[],
): Promise<VrPresenceResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for VR presence response'))
    }, VR_PRESENCE_QUERY_TIMEOUT_MS)

    socket.emit(
      CONNECTION_EVENT.VR_PRESENCE,
      { roomCodes },
      (response: VrPresenceResponse) => {
        clearTimeout(timer)
        resolve(response)
      },
    )
  })
}
