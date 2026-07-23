import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response error interceptor — handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (typeof window !== 'undefined' && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
          const refreshRes = await axios.post(`${backendUrl}/api/refresh`, { refreshToken })
          const newToken = refreshRes.data.token
          localStorage.setItem('token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios(originalRequest)
        } catch (refreshErr) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
        }
      } else {
        localStorage.removeItem('token')
      }
    }
    return Promise.reject(error)
  }
)

export default api
