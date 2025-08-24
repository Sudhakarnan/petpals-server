import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    cb(null, `${Date.now()}_${safe}`)
  },
})

const fileFilter = (req, file, cb) => {
  const ok = /image\/(png|jpe?g|gif|webp)|video\/(mp4|quicktime|webm)/.test(file.mimetype)
  cb(ok ? null : new Error('Invalid file type'), ok)
}

export const uploader = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })