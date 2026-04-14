import { Server, ServerOptions } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
import { CONNECTION_EVENT } from '@virtality/shared/types'
import { connectionHandler } from './sockets/device-event-controller'
// Initialize Socket.IO
const app = express()

// Keepalive endpoint for cron (e.g. GitHub Actions) to prevent free tier sleep
app.get('/line', (_req, res) => {
  res.status(200).send('ok')
})

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
io.on(CONNECTION_EVENT.CONNECTION, connectionHandler)

const httpServerOptions =
  process.env.NODE_ENV !== 'production'
    ? { port: PORT, host: '0.0.0.0' }
    : { port: PORT }

httpServer.listen(httpServerOptions, () => {
  console.log(`Server listening on port ${PORT}`)
})
