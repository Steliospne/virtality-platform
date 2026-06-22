import type { Socket as ClientSocket } from 'socket.io-client'

export function waitForEvent<T>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for event "${event}"`))
    }, timeoutMs)

    socket.once(event, (payload: T) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

export function waitForConnect(
  socket: ClientSocket,
  timeoutMs = 3000,
): Promise<void> {
  if (socket.connected) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for socket connect'))
    }, timeoutMs)

    socket.once('connect', () => {
      clearTimeout(timer)
      resolve()
    })
    socket.once('connect_error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}
