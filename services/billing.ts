import api from '@/lib/api'

export const billingService = {
  getBillingStats: async () => {
    const res = await api.get('/api/billing')
    return res.data
  },
  subscribe: async (plan: string, billingPeriod: 'monthly' | 'yearly') => {
    const res = await api.post('/api/billing/subscribe', { plan, billingPeriod })
    return res.data
  },
  purchaseAddon: async (addon: string) => {
    const res = await api.post('/api/billing/add-on', { addon })
    return res.data
  }
}
