import { Router, Response } from 'express'
import { query } from '../lib/db'
import { authenticateToken, AuthRequest } from './auth'

const router = Router()

// GET /api/billing - fetch the current user's active billing stats
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const result = await query(
      'SELECT plan, billing_period, ai_prompts_used, extra_ai_credits, active_workspaces FROM users WHERE id = $1',
      [userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.status(200).json(result.rows[0])
  } catch (e) {
    console.error('Billing stats fetch error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/billing/subscribe - upgrade/change the user's plan
router.post('/subscribe', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { plan, billingPeriod } = req.body
    if (!plan || !billingPeriod) {
      return res.status(400).json({ error: 'Missing plan or billingPeriod' })
    }

    let activeWorkspaces = 1
    if (plan === 'pro') activeWorkspaces = 5
    else if (plan === 'team') activeWorkspaces = 100
    else if (plan === 'enterprise') activeWorkspaces = 1000

    await query(
      'UPDATE users SET plan = $1, billing_period = $2, active_workspaces = $3 WHERE id = $4',
      [plan, billingPeriod, activeWorkspaces, userId]
    )
    return res.status(200).json({ success: true, plan, billingPeriod })
  } catch (e) {
    console.error('Plan upgrade error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/billing/add-on - purchase an add-on
router.post('/add-on', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { addon } = req.body
    if (!addon) {
      return res.status(400).json({ error: 'Missing addon type' })
    }

    if (addon === 'Extra AI Credits') {
      await query('UPDATE users SET extra_ai_credits = extra_ai_credits + 500 WHERE id = $1', [userId])
    } else if (addon === 'Extra Workspace') {
      await query('UPDATE users SET active_workspaces = active_workspaces + 1 WHERE id = $1', [userId])
    }

    return res.status(200).json({ success: true, message: `Successfully purchased ${addon} add-on` })
  } catch (e) {
    console.error('Add-on purchase error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
})

export default router
