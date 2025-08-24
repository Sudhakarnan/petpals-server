import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next() // allow connect even if guest (won't join room)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = { id: payload.id }
    } catch {}
    next()
  })

  io.on('connection', (socket) => {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`)
    socket.on('disconnect', () => {})
  })
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}
