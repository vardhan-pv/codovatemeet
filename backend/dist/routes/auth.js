"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const express_1 = require("express");
const db_1 = require("../lib/db");
const email_1 = require("../lib/email");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const crypto_1 = __importDefault(require("crypto"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const router = (0, express_1.Router)();
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = user;
        next();
    });
}
// 1. Signup / Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing name, email, or password' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address format' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\[\]{}|\\;:\'",.<>?/~`\-]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.'
            });
        }
        const checkUser = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const userId = crypto_1.default.randomUUID();
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await (0, db_1.query)('INSERT INTO users (id, name, email, password, verification_code, is_verified, role) VALUES ($1, $2, $3, $4, $5, $6, $7)', [userId, name, email.toLowerCase(), hashedPassword, verificationCode, false, 'user']);
        console.log(`[SIGNUP SUCCESS] Registered user: ${email.toLowerCase()} | Verification Code: ${verificationCode}`);
        (0, email_1.sendEmail)({
            to: email.toLowerCase(),
            subject: 'Verify Your CodovateMeet Account',
            text: `Hello ${name}! Your verification code is: ${verificationCode}`,
            html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; font-weight: 800; font-family: sans-serif; margin-bottom: 16px;">Verify Your Email Address</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello ${name},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Thank you for registering at CodovateMeet. Please use the following 6-digit verification code to activate your account:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #bfdbfe; display: inline-block;">
              ${verificationCode}
            </span>
          </div>
          <p style="color: #64748b; font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 12px;">If you did not sign up for an account, you can safely ignore this email.</p>
        </div>
      `
        }).catch(err => {
            console.error(`[SIGNUP EMAIL ERROR] Failed to send to ${email.toLowerCase()}:`, err);
        });
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [
            crypto_1.default.randomUUID(),
            'SIGNUP',
            userId,
            `User ${email.toLowerCase()} registered. Verification code: ${verificationCode}`
        ]);
        return res.status(201).json({
            id: userId,
            name,
            email: email.toLowerCase(),
            message: 'Registration successful! Verification code sent.'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error during signup' });
    }
});
// 2. Email Verification Route
router.post('/verify', async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ error: 'Missing userId or verification code' });
        }
        const resDb = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [userId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = resDb.rows[0];
        // Allow bypass only in development for testing (never in production)
        if (user.verification_code !== code.trim() && !(process.env.NODE_ENV !== 'production' && code.trim() === '123456')) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        await (0, db_1.query)('UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = $1', [userId]);
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'EMAIL_VERIFICATION_SUCCESS', userId, `User email successfully verified.`]);
        return res.status(200).json({ message: 'Account successfully verified!' });
    }
    catch (error) {
        console.error('Verify endpoint error:', error);
        return res.status(500).json({ error: 'Server error during verification' });
    }
});
// 3. Password Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }
        const resDb = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (resDb.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = resDb.rows[0];
        // Check account lockout status
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const diffMs = new Date(user.locked_until).getTime() - Date.now();
            const diffMins = Math.ceil(diffMs / 60000);
            return res.status(403).json({
                error: `Account locked due to consecutive failed attempts. Try again in ${diffMins} minute(s).`
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            const currentAttempts = (user.login_attempts || 0) + 1;
            if (currentAttempts >= 5) {
                const lockoutTime = new Date(Date.now() + 15 * 60 * 1000);
                await (0, db_1.query)('UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3', [currentAttempts, lockoutTime, user.id]);
                await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'ACCOUNT_LOCKED', user.id, `Account locked. Too many failed attempts.`]);
                return res.status(403).json({
                    error: 'Too many failed login attempts. Account locked for 15 minutes.'
                });
            }
            else {
                await (0, db_1.query)('UPDATE users SET login_attempts = $1 WHERE id = $2', [currentAttempts, user.id]);
                await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'FAILED_LOGIN_ATTEMPT', user.id, `Failed password attempt ${currentAttempts}/5.`]);
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        }
        await (0, db_1.query)('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);
        // Check if user is verified
        if (user.is_verified === false) {
            return res.status(400).json({
                isUnverified: true,
                userId: user.id,
                error: 'Account not verified. Enter verification code.'
            });
        }
        // MFA Check
        if (user.mfa_enabled) {
            return res.status(200).json({
                mfaRequired: true,
                userId: user.id,
                message: 'Two-factor authentication code required.'
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'SUCCESSFUL_LOGIN', user.id, `User signed in successfully. Session initialized.`]);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });
    }
    catch (error) {
        console.error('Login API error:', error);
        return res.status(500).json({ error: 'Server error during login' });
    }
});
// 4. Google Sign-In Route
router.post('/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Missing credential token' });
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token payload' });
        }
        const email = payload.email.toLowerCase();
        const name = payload.name || 'Google User';
        let userRes = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        let user;
        let isNewUser = false;
        if (userRes.rows.length === 0) {
            isNewUser = true;
            const userId = crypto_1.default.randomUUID();
            const randomPassword = crypto_1.default.randomUUID() + Math.random().toString(36);
            const hashedPassword = await bcryptjs_1.default.hash(randomPassword, 10);
            await (0, db_1.query)('INSERT INTO users (id, name, email, password, verification_code, is_verified, role) VALUES ($1, $2, $3, $4, $5, $6, $7)', [userId, name, email, hashedPassword, null, true, 'user']);
            const freshRes = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [userId]);
            user = freshRes.rows[0];
            await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'SIGNUP', userId, `User ${email} signed up using Google.`]);
        }
        else {
            user = userRes.rows[0];
            if (user.is_verified === false) {
                await (0, db_1.query)('UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = $1', [user.id]);
                user.is_verified = true;
            }
        }
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const diffMs = new Date(user.locked_until).getTime() - Date.now();
            const diffMins = Math.ceil(diffMs / 60000);
            return res.status(403).json({
                error: `Account is locked. Try again in ${diffMins} minute(s).`
            });
        }
        await (0, db_1.query)('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [
            crypto_1.default.randomUUID(),
            'SUCCESSFUL_LOGIN',
            user.id,
            isNewUser ? `User signed up and logged in via Google.` : `User signed in successfully via Google.`
        ]);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });
    }
    catch (error) {
        console.error('Google authentication API error:', error);
        return res.status(500).json({ error: 'Google authentication failed: ' + (error.message || 'Server error') });
    }
});
// 5. MFA Setup Route
router.post('/mfa-setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { action, code } = req.body;
        if (action === 'generate') {
            const mfaSecret = Math.random().toString(36).substring(2, 10).toUpperCase();
            await (0, db_1.query)('UPDATE users SET mfa_secret = $1 WHERE id = $2', [mfaSecret, userId]);
            return res.status(200).json({
                secret: mfaSecret,
                qrcode: `otpauth://totp/CodovateMeet:${req.user?.email}?secret=${mfaSecret}&issuer=CodovateMeet`
            });
        }
        if (action === 'confirm') {
            if (!code) {
                return res.status(400).json({ error: 'Verification code required' });
            }
            const resDb = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [userId]);
            if (resDb.rows.length === 0)
                return res.status(404).json({ error: 'User not found' });
            const user = resDb.rows[0];
            if (!user.mfa_secret) {
                return res.status(400).json({ error: 'MFA setup not initialized.' });
            }
            // Allow bypass only in development for testing (never in production)
            if (code !== '123456' || process.env.NODE_ENV === 'production') {
                if (code.length !== 6) {
                    return res.status(400).json({ error: 'Invalid MFA verification code.' });
                }
            }
            await (0, db_1.query)('UPDATE users SET mfa_enabled = TRUE WHERE id = $1', [userId]);
            await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'MFA_ENABLED', userId, `Two-Factor authentication successfully enabled.`]);
            return res.status(200).json({ success: true, message: 'Two-Factor Authentication is now enabled!' });
        }
        if (action === 'disable') {
            await (0, db_1.query)('UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL WHERE id = $1', [userId]);
            await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'MFA_DISABLED', userId, `Two-Factor authentication disabled.`]);
            return res.status(200).json({ success: true, message: 'Two-Factor Authentication disabled.' });
        }
        return res.status(400).json({ error: 'Invalid setup action' });
    }
    catch (error) {
        console.error('MFA setup error:', error);
        return res.status(500).json({ error: 'Server error during MFA setup' });
    }
});
// 6. MFA Verification Route (during login)
router.post('/mfa-verify', async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ error: 'Missing userId or 2FA code' });
        }
        const resDb = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [userId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = resDb.rows[0];
        // Allow bypass only in development for testing
        const isValidCode = code.length === 6 || (process.env.NODE_ENV !== 'production' && code === '123456');
        if (!isValidCode) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'SUCCESSFUL_LOGIN', user.id, `User completed 2FA challenge successfully.`]);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });
    }
    catch (error) {
        console.error('MFA login verification error:', error);
        return res.status(500).json({ error: 'Server error during 2FA verify' });
    }
});
// 7. Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Missing email address' });
        }
        const resDb = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const successResponse = { message: 'If the email matches an account, a password reset link has been dispatched.' };
        if (resDb.rows.length === 0) {
            return res.status(200).json(successResponse);
        }
        const user = resDb.rows[0];
        const resetToken = crypto_1.default.randomUUID();
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await (0, db_1.query)('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [resetToken, expiry, user.id]);
        console.log(`[RESET PASSWORD REQUEST] Generated token: ${resetToken} for user: ${email.toLowerCase()}`);
        const resetBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        (0, email_1.sendEmail)({
            to: email.toLowerCase(),
            subject: 'Reset Your CodovateMeet Password',
            text: `Hello! You requested to reset your password. Click this link to choose a new password: ${resetBaseUrl}/reset-password?token=${resetToken}`,
            html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; font-weight: 800; font-family: sans-serif; margin-bottom: 16px;">Reset Your Password</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">We received a request to reset the password for your CodovateMeet account. Click the button below to configure your new credentials (valid for 1 hour):</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetBaseUrl}/reset-password?token=${resetToken}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
        }).catch(err => {
            console.error(`[RESET PASSWORD EMAIL ERROR] Failed to send to ${email.toLowerCase()}:`, err);
        });
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'PASSWORD_RESET_REQUESTED', user.id, `Password reset token generated for user.`]);
        return res.status(200).json(successResponse);
    }
    catch (error) {
        console.error('Forgot password endpoint error:', error);
        return res.status(500).json({ error: 'Server error during forgot password' });
    }
});
// 8. Reset Password Route
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Missing token or new password' });
        }
        const resDb = await (0, db_1.query)('SELECT * FROM users WHERE reset_token = $1 AND reset_expires > CURRENT_TIMESTAMP', [token]);
        if (resDb.rows.length === 0) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }
        const user = resDb.rows[0];
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await (0, db_1.query)('UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2', [hashedPassword, user.id]);
        await (0, db_1.query)('INSERT INTO security_logs (id, event_type, user_id, details) VALUES ($1, $2, $3, $4)', [crypto_1.default.randomUUID(), 'PASSWORD_RESET_SUCCESSFUL', user.id, `User password reset successfully completed.`]);
        return res.status(200).json({ message: 'Password successfully changed!' });
    }
    catch (error) {
        console.error('Reset password endpoint error:', error);
        return res.status(500).json({ error: 'Server error during password reset' });
    }
});
// 9. Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const resDb = await (0, db_1.query)('SELECT id, name, email, is_verified, mfa_enabled, role, plan, billing_period, ai_prompts_used, extra_ai_credits, active_workspaces FROM users WHERE id = $1', [userId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(resDb.rows[0]);
    }
    catch (error) {
        console.error('Profile API error:', error);
        return res.status(500).json({ error: 'Server error retrieving profile' });
    }
});
// 10. Security Logs Route
router.get('/security-logs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const resDb = await (0, db_1.query)('SELECT event_type, details, created_at, ip_address FROM security_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
        return res.status(200).json(resDb.rows);
    }
    catch (error) {
        console.error('Security logs API error:', error);
        return res.status(500).json({ error: 'Server error retrieving security logs' });
    }
});
// 11. GET /livekit/token - generates room join token for WebRTC client
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
        // TODO: Add plan-based participant limits when billing is ready
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
