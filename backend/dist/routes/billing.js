"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// GET /api/billing - fetch the current user's active billing stats
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await (0, db_1.query)('SELECT plan, billing_period, ai_prompts_used, extra_ai_credits, active_workspaces FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(result.rows[0]);
    }
    catch (e) {
        console.error('Billing stats fetch error:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});
// POST /api/billing/subscribe - upgrade/change the user's plan
router.post('/subscribe', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { plan, billingPeriod } = req.body;
        if (!plan || !billingPeriod) {
            return res.status(400).json({ error: 'Missing plan or billingPeriod' });
        }
        let activeWorkspaces = 1;
        if (plan === 'pro')
            activeWorkspaces = 5;
        else if (plan === 'team')
            activeWorkspaces = 100;
        else if (plan === 'enterprise')
            activeWorkspaces = 1000;
        await (0, db_1.query)('UPDATE users SET plan = $1, billing_period = $2, active_workspaces = $3 WHERE id = $4', [plan, billingPeriod, activeWorkspaces, userId]);
        return res.status(200).json({ success: true, plan, billingPeriod });
    }
    catch (e) {
        console.error('Plan upgrade error:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});
// POST /api/billing/add-on - purchase an add-on
router.post('/add-on', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { addon } = req.body;
        if (!addon) {
            return res.status(400).json({ error: 'Missing addon type' });
        }
        if (addon === 'Extra AI Credits') {
            await (0, db_1.query)('UPDATE users SET extra_ai_credits = extra_ai_credits + 500 WHERE id = $1', [userId]);
        }
        else if (addon === 'Extra Workspace') {
            await (0, db_1.query)('UPDATE users SET active_workspaces = active_workspaces + 1 WHERE id = $1', [userId]);
        }
        return res.status(200).json({ success: true, message: `Successfully purchased ${addon} add-on` });
    }
    catch (e) {
        console.error('Add-on purchase error:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
