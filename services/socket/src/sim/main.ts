import { io } from 'socket.io-client'
import { CONNECTION_EVENT, ROOM_PEER_ROLE } from '@virtality/shared/types'
import { createSimulatedHeadset, type Emit } from './simulated-headset'

/**
 * Simulated Headset: a standalone `vr` peer for a normally-running socket
 * server. Run with `ROOM_CODE=<deviceId> pnpm --filter @virtality/socket dev_sim`.
 */

const TICK_MS = 100

const { ROOM_CODE, SOCKET_URL = 'http://localhost:8081' } = process.env

if (!ROOM_CODE) {
  console.error('Missing ROOM_CODE (the device id shown in the console).')
  process.exit(1)
}

const socket = io(SOCKET_URL, {
  query: { roomCode: ROOM_CODE, role: ROOM_PEER_ROLE.Vr },
})
const headset = createSimulatedHeadset()

function send(emits: Emit[]) {
  for (const { event, payload } of emits) {
    console.log(`[sim] → ${event}`, payload ?? '')
    if (payload === undefined) socket.emit(event)
    else socket.emit(event, payload)
  }
}

socket.on('connect', () => {
  console.log(
    `[sim] connected as ${socket.id} to ${SOCKET_URL}, room ${ROOM_CODE}`,
  )
})
socket.on(CONNECTION_EVENT.DISCONNECTION, (reason) => {
  console.log(`[sim] disconnected: ${reason}`)
})
socket.on(CONNECTION_EVENT.ERROR, (error) => {
  console.error('[sim] server rejected the connection:', error)
})

socket.onAny((event: string, payload?: unknown) => {
  console.log(`[sim] ← ${event}`, payload ?? '')
  send(headset.handle(event, payload))
})

const ticker = setInterval(() => send(headset.tick(Date.now())), TICK_MS)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    clearInterval(ticker)
    socket.close()
    process.exit(0)
  })
}
