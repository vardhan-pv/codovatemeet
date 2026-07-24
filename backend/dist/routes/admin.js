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
// Admin Middleware check
async function requireAdmin(req, res, next) {
    const userId = req.user?.id;
    const userRes = await (0, db_1.query)('SELECT role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0 || userRes.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
    }
    next();
}
// 1. GET /api/admin/users
router.get('/users', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT id, name, email, role, created_at, is_verified, plan FROM users ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Admin GET users error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 2. PUT /api/admin/users/:id/role
router.put('/users/:id/role', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        if (role !== 'user' && role !== 'admin') {
            return res.status(400).json({ error: 'Invalid role' });
        }
        await (0, db_1.query)('UPDATE users SET role = $1 WHERE id = $2', [role, targetUserId]);
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'USER_ROLE_CHANGED', req.user?.id, `Admin changed user ${targetUserId} role to ${role}.`]);
        return res.status(200).json({ success: true, message: 'User role updated successfully!' });
    }
    catch (error) {
        console.error('Admin change role error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 3. DELETE /api/admin/users/:id
router.delete('/users/:id', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        // Prevent admin from deleting themselves
        if (targetUserId === req.user?.id) {
            return res.status(400).json({ error: 'Cannot delete your own admin account.' });
        }
        await (0, db_1.query)('DELETE FROM users WHERE id = $1', [targetUserId]);
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'USER_DELETED', req.user?.id, `Admin deleted user ${targetUserId}.`]);
        return res.status(200).json({ success: true, message: 'User deleted successfully!' });
    }
    catch (error) {
        console.error('Admin delete user error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 4. GET /api/admin/meetings
router.get('/meetings', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT m.id, m.room_name, m.meeting_code, m.created_at, m.scheduled_at, m.duration_minutes, u.name as host_name FROM meetings m JOIN users u ON m.host_id = u.id ORDER BY m.created_at DESC');
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Admin GET meetings error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 5. DELETE /api/admin/meetings/:id
router.delete('/meetings/:id', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const meetingId = req.params.id;
        await (0, db_1.query)('DELETE FROM meetings WHERE id = $1', [meetingId]);
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'MEETING_DELETED', req.user?.id, `Admin deleted meeting ${meetingId}.`]);
        return res.status(200).json({ success: true, message: 'Meeting deleted successfully!' });
    }
    catch (error) {
        console.error('Admin delete meeting error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
// 6. GET /api/admin/logs
router.get('/logs', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT l.event_type, l.details, l.created_at, u.name as user_name FROM security_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100');
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Admin GET logs error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
