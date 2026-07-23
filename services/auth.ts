import api from '@/lib/api'

export const authService = {
  async register(name: string, email: string, password: string) {
    const response = await api.post('/api/register', { name, email, password })
    return response.data
  },

  async login(email: string, password: string) {
    const response = await api.post('/api/login', { email, password })
    return response.data
  },

  async getProfile() {
    const response = await api.get('/api/profile')
    return response.data
  },

  async githubLogin(code: string) {
    const response = await api.post('/api/auth/github', { code })
    return response.data
  },

  async refresh(refreshToken: string) {
    const response = await api.post('/api/refresh', { refreshToken })
    return response.data
  },

  async forgotPassword(email: string) {
    const response = await api.post('/api/forgot-password', { email })
    return response.data
  },

  async resetPassword(password: string, token: string) {
    const response = await api.post('/api/reset-password', { password, token })
    return response.data
  },

  async updateProfile(data: { name: string; username?: string; bio?: string; timezone?: string; language?: string; avatarUrl?: string }) {
    const response = await api.put('/api/profile', data)
    return response.data
  },

  async getSecurityLogs() {
    const response = await api.get('/api/security-logs')
    return response.data
  }
}
