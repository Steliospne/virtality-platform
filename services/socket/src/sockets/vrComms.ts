import { Socket } from 'socket.io'

export const createEventHandler = (
  key: string,
  event: { [key: string]: { name: string; payload: boolean } },
  roomCode: string | string[],
  socket: Socket,
) => {
  socket.on(event[key].name, (payload: any) => {
    console.log(`[RECEIVE] Event: ${event[key].name}`)
    console.log(`[EMIT] Event: ${event[key].name} to room: ${roomCode}`)
    if (payload !== undefined) console.log(`[PAYLOAD]`, payload)

    socket
      .to(roomCode)
      .emit(event[key].name, event[key].payload ? payload : undefined)
  })
}
