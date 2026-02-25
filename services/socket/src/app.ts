import { Server, ServerOptions } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
import { _EVENT, CONNECTION_EVENT } from './types/models'
import { connectionHandler } from './sockets/prod-server'
// Initialize Socket.IO
const app = express()

const httpServer = createServer(app)

console.log('env: ', process.env.ENV)
console.log('node env: ', process.env.NODE_ENV)
console.log('sim: ', process.env.SIM)

const socketOptions = {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://console.virtality.app',
      'https://preview-console.virtality.app',
    ],
  },
} satisfies Partial<ServerOptions>

const io = new Server(httpServer, socketOptions)

const PORT = process.env.PORT || '8081'

// Socket.IO connection handler
io.on(CONNECTION_EVENT.CONNECTION, connectionHandler.bind(null, io))

const httpServerOptions =
  process.env.NODE_ENV !== 'production'
    ? { port: PORT, host: '0.0.0.0' }
    : { port: PORT }

httpServer.listen(httpServerOptions, () => {
  console.log(`Server listening on port ${PORT}`)
})
