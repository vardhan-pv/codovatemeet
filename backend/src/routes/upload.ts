import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { authenticateToken, AuthRequest } from './auth'

const router = Router()

// Define paths
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads')
const RECORDINGS_DIR = path.join(__dirname, '../../public/recordings')

// Ensure paths exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true })
}

// Multer Storage configurations
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    cb(null, `${base}-${unique}${ext}`)
  }
})

const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RECORDINGS_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm'
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    cb(null, `recording-${unique}${ext}`)
  }
})

const fileUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

const recordingUpload = multer({
  storage: recordingStorage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB
})

// 1. POST /api/messages/upload
router.post('/messages/upload', authenticateToken, fileUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`
    return res.status(200).json({
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
  } catch (error) {
    console.error('File upload error:', error)
    return res.status(500).json({ error: 'Failed to process file upload' })
  }
})

// 2. POST /api/recordings/upload
router.post('/recordings/upload', authenticateToken, recordingUpload.single('recording'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No recording file uploaded' })
    }

    const recordingUrl = `/recordings/${req.file.filename}`
    return res.status(200).json({
      url: recordingUrl,
      name: req.file.originalname,
      size: req.file.size
    })
  } catch (error) {
    console.error('Recording upload error:', error)
    return res.status(500).json({ error: 'Failed to process cloud recording upload' })
  }
})

export default router
