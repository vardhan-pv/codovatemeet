import { Router, Request, Response } from 'express'
import { AccessToken } from 'livekit-server-sdk'
import { query } from '../lib/db'
import { authenticateToken, AuthRequest } from './auth'
import { sendEmail } from '../lib/email'
import crypto from 'crypto'

const router = Router()

// 1. GET /meetings - checks if a meeting exists or gets recent meetings for authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string

    if (code) {
      const result = await query(
        `SELECT m.*, u.name as host_name 
         FROM meetings m 
         JOIN users u ON m.host_id = u.id 
         WHERE m.meeting_code = $1`,
        [code.toUpperCase()]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Meeting not found' })
      }
      return res.status(200).json(result.rows[0])
    }

    // Authenticated path: fetch recent meetings for host
    // Cast req to AuthRequest
    const authReq = req as AuthRequest
    // Manually run authenticateToken as middleware/helper here since GET / has an anonymous branch (checking code) and authenticated branch
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' })
    }

    let decoded;
    try {
      decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' })
      }
    } catch (jwtErr) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
    }

    const result = await query(
      `SELECT m.*, u.name as host_name, mh.duration as actual_duration
       FROM meetings m 
       JOIN users u ON m.host_id = u.id 
       LEFT JOIN meeting_history mh ON m.id = mh.meeting_id
       WHERE m.host_id = $1 
       ORDER BY m.created_at DESC LIMIT 10`,
      [decoded.id]
    )
    return res.status(200).json(result.rows)
  } catch (error) {
    console.error('Meetings GET error:', error)
    return res.status(500).json({ error: 'Server or authentication error' })
  }
})

// 2. POST /meetings - creates a new meeting code and stores it
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const hostName = req.user?.name || 'Your Host'
    const { roomName = 'Untitled Meeting', scheduledAt = new Date(), type = 'technical', durationMinutes = 60, guests = '' } = req.body

    // Generate CDV code: CDV-XXXX-XXXX
    const uuid = crypto.randomUUID().toUpperCase()
    const segments = uuid.split('-')
    const meetingCode = `CDV-${segments[1]}-${segments[2]}`
    const meetingId = crypto.randomUUID()

    await query(
      'INSERT INTO meetings (id, meeting_code, host_id, room_name, scheduled_at, type, duration_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [meetingId, meetingCode, userId, roomName, new Date(scheduledAt), type, Number(durationMinutes)]
    )

    // Parse meeting name/description from serialized JSON blob if present
    let meetingTitle = roomName
    let meetingDesc = ''
    let meetingTz = ''
    if (typeof roomName === 'string' && roomName.startsWith('{')) {
      try {
        const parsed = JSON.parse(roomName)
        meetingTitle = parsed.name || roomName
        meetingDesc = parsed.desc || ''
        meetingTz = parsed.tz || ''
      } catch (_) {}
    }

    // Send invitation emails to all guests (done asynchronously in the background)
    if (guests && typeof guests === 'string') {
      const guestEmails = guests.split(',').map((e: string) => e.trim()).filter(Boolean)
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const joinLink = `${baseUrl}/room?id=${meetingCode}`
      const scheduledDate = new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })

      Promise.all(guestEmails.map(async (guestEmail) => {
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Meeting Invitation</title></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1d2e;border-radius:16px;overflow:hidden;border:1px solid #2a2d4a;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 36px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:18px;">📹</span>
        </div>
        <span style="color:white;font-weight:800;font-size:20px;letter-spacing:-0.5px;">Codovate Meet</span>
      </div>
      <h1 style="color:white;margin:0;font-size:26px;font-weight:800;line-height:1.2;">You're Invited to a Meeting</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">You've been added as a guest by <strong>${hostName}</strong></p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;color:#e2e8f0;">

      <!-- Meeting Title -->
      <div style="background:#242740;border:1px solid #2f3255;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#818cf8;text-transform:uppercase;letter-spacing:1px;">Meeting</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">${meetingTitle}</p>
        ${meetingDesc ? `<p style="margin:8px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">${meetingDesc}</p>` : ''}
      </div>

      <!-- Details Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:#242740;border:1px solid #2f3255;border-radius:10px;padding:16px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">📅 Date & Time</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;line-height:1.4;">${scheduledDate}${meetingTz ? `<br><span style="font-size:11px;color:#64748b;">${meetingTz}</span>` : ''}</p>
        </div>
        <div style="background:#242740;border:1px solid #2f3255;border-radius:10px;padding:16px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">⏱️ Duration</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">${durationMinutes} minutes</p>
        </div>
        <div style="background:#242740;border:1px solid #2f3255;border-radius:10px;padding:16px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">👤 Host</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">${hostName}</p>
        </div>
        <div style="background:#242740;border:1px solid #2f3255;border-radius:10px;padding:16px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">🏷️ Type</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;text-transform:capitalize;">${type}</p>
        </div>
      </div>

      <!-- Meeting Code -->
      <div style="background:#1e1b4b;border:1px solid #3730a3;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#818cf8;text-transform:uppercase;">Meeting Code</p>
        <p style="margin:0;font-family:monospace;font-size:22px;font-weight:800;color:#a5b4fc;letter-spacing:2px;">${meetingCode}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${joinLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
          Join Meeting →
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
        Or paste this link in your browser:<br>
        <a href="${joinLink}" style="color:#818cf8;font-size:11px;">${joinLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#111827;padding:16px 36px;border-top:1px solid #1f2937;">
      <p style="margin:0;font-size:11px;color:#374151;text-align:center;">Sent by Codovate Meet · ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`

        const text = `You're invited to "${meetingTitle}" on ${scheduledDate} (${durationMinutes} min) hosted by ${hostName}. Join at: ${joinLink} or use code ${meetingCode}`

        try {
          await sendEmail({ to: guestEmail, subject: `📅 Meeting Invite: ${meetingTitle}`, html, text })
        } catch (emailErr) {
          console.error(`Failed to send invite to ${guestEmail}:`, emailErr)
        }
      })).catch(err => {
        console.error('Failed to send guest emails:', err)
      })
    }

    return res.status(201).json({ meetingId: meetingCode })
  } catch (error: any) {
    console.error('Meetings POST error:', error)
    return res.status(500).json({ error: error.message || 'Server or database error' })
  }
})

// 3. POST /meetings/end - logs meeting history
router.post('/end', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { meetingCode, durationSeconds } = req.body

    if (!meetingCode || durationSeconds === undefined) {
      return res.status(400).json({ error: 'Missing meetingCode or durationSeconds' })
    }

    const meetingRes = await query('SELECT id, host_id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()])
    if (meetingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' })
    }
    const meeting = meetingRes.rows[0]
    
    if (meeting.host_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Only host can save history' })
    }
    
    const historyId = crypto.randomUUID()

    await query(
      'INSERT INTO meeting_history (id, meeting_id, duration) VALUES ($1, $2, $3)',
      [historyId, meeting.id, durationSeconds]
    )

    return res.status(201).json({ success: true })
  } catch (error) {
    console.error('Meetings End POST error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
