import { Socket } from 'socket.io'
import { createAppLogger } from '@virtality/shared/observability'

const logger = createAppLogger({
  serviceName: 'socket',
  defaultAttributes: {
    component: 'vr-comms',
  },
})

export const createEventHandler = (
  key: string,
  event: { [key: string]: { name: string; payload: boolean } },
  roomCode: string | string[],
  socket: Socket,
) => {
  socket.on(event[key].name, (payload: any) => {
    logger.info('socket.relay.emit', {
      relayKey: key,
      eventName: event[key].name,
      agent: socket.handshake.query?.agent ?? 'unknown',
      roomCode,
      socketId: socket.id,
      hasPayload: payload !== undefined,
    })

    socket
      .to(roomCode)
      .emit(event[key].name, event[key].payload ? payload : undefined)
  })
}
