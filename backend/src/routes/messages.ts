import { Router, Response } from 'express'
import { query } from '../lib/db'
import { authenticateToken, AuthRequest } from './auth'
import crypto from 'crypto'

const router = Router()

// 1. GET /messages?roomId=XXX - get chat messages
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const meetingCode = req.query.roomId as string
    
    if (!meetingCode) {
      return res.status(400).json({ error: 'Missing roomId' })
    }

    const meetingRes = await query('SELECT id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()])
    if (meetingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' })
    }
    const meetingId = meetingRes.rows[0].id

    const result = await query(`
      SELECT m.id, m.message, m.created_at, u.name as sender_name, u.email as sender_email, m.user_id as sender_id
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.meeting_id = $1
      ORDER BY m.created_at ASC
    `, [meetingId])

    return res.status(200).json(result.rows)
  } catch (error) {
    console.error('Messages GET error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

// 2. POST /messages - post new chat message
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const userName = req.user?.name
    const { meetingCode, message } = req.body

    if (!meetingCode || !message) {
      return res.status(400).json({ error: 'Missing meetingCode or message' })
    }

    const meetingRes = await query('SELECT id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()])
    if (meetingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' })
    }
    const meetingId = meetingRes.rows[0].id
    
    const messageId = crypto.randomUUID()

    const result = await query(
      'INSERT INTO messages (id, meeting_id, user_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [messageId, meetingId, userId, message]
    )

    return res.status(201).json({
      id: messageId,
      message,
      sender_id: userId,
      sender_name: userName,
      created_at: result.rows[0].created_at
    })
  } catch (error) {
    console.error('Messages POST error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
