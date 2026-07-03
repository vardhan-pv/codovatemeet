"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const db_1 = require("../lib/db");
const auth_1 = require("./auth");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// 1. GET /meetings - checks if a meeting exists or gets recent meetings for authenticated user
router.get('/', async (req, res) => {
    try {
        const code = req.query.code;
        if (code) {
            const result = await (0, db_1.query)(`SELECT m.*, u.name as host_name 
         FROM meetings m 
         JOIN users u ON m.host_id = u.id 
         WHERE m.meeting_code = $1`, [code.toUpperCase()]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Meeting not found' });
            }
            return res.status(200).json(result.rows[0]);
        }
        // Authenticated path: fetch recent meetings for host
        // Cast req to AuthRequest
        const authReq = req;
        // Manually run authenticateToken as middleware/helper here since GET / has an anonymous branch (checking code) and authenticated branch
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        const result = await (0, db_1.query)(`SELECT m.*, u.name as host_name, mh.duration
       FROM meetings m 
       JOIN users u ON m.host_id = u.id 
       LEFT JOIN meeting_history mh ON m.id = mh.meeting_id
       WHERE m.host_id = $1 
       ORDER BY m.created_at DESC LIMIT 10`, [decoded.id]);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Meetings GET error:', error);
        return res.status(500).json({ error: 'Server or authentication error' });
    }
});
// 2. POST /meetings - creates a new meeting code and stores it
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { roomName = 'Untitled Meeting', scheduledAt = new Date(), type = 'technical' } = req.body;
        // Generate CDV code: CDV-XXXX-XXXX
        const uuid = crypto_1.default.randomUUID().toUpperCase();
        const segments = uuid.split('-');
        const meetingCode = `CDV-${segments[1]}-${segments[2]}`;
        const meetingId = crypto_1.default.randomUUID();
        await (0, db_1.query)('INSERT INTO meetings (id, meeting_code, host_id, room_name, scheduled_at, type) VALUES ($1, $2, $3, $4, $5, $6)', [meetingId, meetingCode, userId, roomName, new Date(scheduledAt), type]);
        return res.status(201).json({ meetingId: meetingCode });
    }
    catch (error) {
        console.error('Meetings POST error:', error);
        return res.status(500).json({ error: error.message || 'Server or database error' });
    }
});
// 3. POST /meetings/end - logs meeting history
router.post('/end', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { meetingCode, durationSeconds } = req.body;
        if (!meetingCode || durationSeconds === undefined) {
            return res.status(400).json({ error: 'Missing meetingCode or durationSeconds' });
        }
        const meetingRes = await (0, db_1.query)('SELECT id, host_id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()]);
        if (meetingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        const meeting = meetingRes.rows[0];
        if (meeting.host_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Only host can save history' });
        }
        const historyId = crypto_1.default.randomUUID();
        await (0, db_1.query)('INSERT INTO meeting_history (id, meeting_id, duration) VALUES ($1, $2, $3)', [historyId, meeting.id, durationSeconds]);
        return res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Meetings End POST error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 4. GET /livekit/token - generates room join token
router.get('/livekit/token', async (req, res) => {
    try {
        const room = req.query.room;
        const identity = req.query.identity;
        if (!room || !identity) {
            return res.status(400).json({ error: 'Missing room or identity' });
        }
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.LIVEKIT_URL;
        if (!apiKey || !apiSecret) {
            console.error('LiveKit credentials are not defined in backend .env');
            return res.status(500).json({ error: 'LiveKit server credentials not configured' });
        }
        const at = new livekit_server_sdk_1.AccessToken(apiKey, apiSecret, {
            identity: identity
        });
        at.addGrant({
            roomJoin: true,
            room: room,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true
        });
        const token = await at.toJwt();
        return res.status(200).json({ token, serverUrl: wsUrl });
    }
    catch (error) {
        console.error('LiveKit token generation error:', error);
        return res.status(500).json({ error: 'Token generation failed' });
    }
});
exports.default = router;
