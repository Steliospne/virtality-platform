import { createServer } from 'http'
import type { AddressInfo } from 'node:net'
import { Server, type Socket } from 'socket.io'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import { CONNECTION_EVENT } from '@virtality/shared/types'

export type SocketTestQuery = {
  roomCode: string
  role?: string
}

export type SocketTestHarness = {
  connectClient: (query: SocketTestQuery) => ClientSocket
  disconnectClients: () => void
  start: () => Promise<void>
  stop: () => Promise<void>
}

export function createSocketTestHarness(
  connectionHandler: (socket: Socket) => void,
): SocketTestHarness {
  const httpServer = createServer()
  const clients: ClientSocket[] = []
  let port = 0

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  })
  io.on(CONNECTION_EVENT.CONNECTION, connectionHandler)

  return {
    async start() {
      await new Promise<void>((resolve) => {
        httpServer.listen(0, '127.0.0.1', () => resolve())
      })
      port = (httpServer.address() as AddressInfo).port
    },

    async stop() {
      for (const client of clients) {
        client.disconnect()
      }
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    },

    disconnectClients() {
      while (clients.length > 0) {
        clients.pop()?.disconnect()
      }
    },

    connectClient(query) {
      const client = ioClient(`http://127.0.0.1:${port}`, {
        query,
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
      })
      clients.push(client)
      return client
    },
  }
}

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

export function waitForDisconnect(
  socket: ClientSocket,
  timeoutMs = 3000,
): Promise<void> {
  if (!socket.connected) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for socket disconnect'))
    }, timeoutMs)

    socket.once('disconnect', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

export function expectNoEvent(
  socket: ClientSocket,
  event: string,
  windowMs = 500,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      clearTimeout(timer)
      reject(new Error(`Unexpected event "${event}" received`))
    }

    const timer = setTimeout(() => {
      socket.off(event, onEvent)
      resolve()
    }, windowMs)

    socket.on(event, onEvent)
  })
}
