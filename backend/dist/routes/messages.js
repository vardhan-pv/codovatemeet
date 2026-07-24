"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("./auth");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// 1. GET /messages?roomId=XXX - get chat messages
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const meetingCode = req.query.roomId;
        if (!meetingCode) {
            return res.status(400).json({ error: 'Missing roomId' });
        }
        const meetingRes = await (0, db_1.query)('SELECT id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()]);
        if (meetingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        const meetingId = meetingRes.rows[0].id;
        const result = await (0, db_1.query)(`
      SELECT m.id, m.message, m.created_at, u.name as sender_name, u.email as sender_email, m.user_id as sender_id,
             m.attachment_url, m.attachment_name
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.meeting_id = $1
      ORDER BY m.created_at ASC
    `, [meetingId]);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Messages GET error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 2. POST /messages - post new chat message
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const userName = req.user?.name;
        const { meetingCode, message, attachmentUrl, attachmentName } = req.body;
        if (!meetingCode || (!message && !attachmentUrl)) {
            return res.status(400).json({ error: 'Missing meetingCode or message/attachment' });
        }
        const meetingRes = await (0, db_1.query)('SELECT id FROM meetings WHERE meeting_code = $1', [meetingCode.toUpperCase()]);
        if (meetingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        const meetingId = meetingRes.rows[0].id;
        const messageId = crypto_1.default.randomUUID();
        const result = await (0, db_1.query)('INSERT INTO messages (id, meeting_id, user_id, message, attachment_url, attachment_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [messageId, meetingId, userId, message || '', attachmentUrl || null, attachmentName || null]);
        return res.status(201).json({
            id: messageId,
            message: message || '',
            attachment_url: attachmentUrl || null,
            attachment_name: attachmentName || null,
            sender_id: userId,
            sender_name: userName,
            created_at: result.rows[0].created_at
        });
    }
    catch (error) {
        console.error('Messages POST error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
