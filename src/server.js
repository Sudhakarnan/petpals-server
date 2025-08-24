import http from 'http'
import app from './app.js'
import { connectDB } from './config/db.js'
import { initSocket } from './socket.js'

 const PORT = process.env.PORT || 5000
 const server = http.createServer(app)

 connectDB().then(() => {
  initSocket(server)
   server.listen(PORT, () => {
     console.log(`API listening on http://localhost:${PORT}`)
   })
 })