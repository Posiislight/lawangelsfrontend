import axios from 'axios'
import type { AxiosInstance } from 'axios'

// Dynamic API URL: use environment variable in production, otherwise localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Debug logging
if (import.meta.env.VITE_API_URL) {
  console.log('[AuthAPI] Using environment variable API URL:', import.meta.env.VITE_API_URL)
} else {
  console.log('[AuthAPI] Using default localhost API URL:', API_BASE_URL)
}
console.log('[AuthAPI] Initialized with base URL:', API_BASE_URL)

// Create axios instance with credentials
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session auth
})

// Function to get CSRF token from cookie
function getCsrfToken(): string | null {
  const name = 'csrftoken'
  let cookieValue: string | null = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// Fetch CSRF token from Django
async function fetchCsrfToken() {
  try {
    await axios.get(`${API_BASE_URL}/auth/me/`, { withCredentials: true })
  } catch {
    // This will set the CSRF cookie even if the user is not authenticated
  }
}

// Add request interceptor to include CSRF token
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken()
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRFToken'] = csrfToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('API Error - No response:', error.request)
    } else {
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Auth API functions
export const authApi = {
  async register(username: string, email: string, password: string, password2: string, firstName: string, lastName: string) {
    try {
      await fetchCsrfToken()
      const response = await apiClient.post(
        '/auth/register/',
        {
          username,
          email,
          password,
          password2,
          first_name: firstName,
          last_name: lastName,
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error.response?.data || { success: false, message: 'Registration failed' }
    }
  },

  async login(username: string, password: string) {
    try {
      await fetchCsrfToken()
      const response = await apiClient.post(
        '/auth/login/',
        {
          username,
          password,
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      throw error.response?.data || { success: false, message: 'Login failed' }
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/auth/logout/', {})
      return response.data
    } catch (error: any) {
      console.error('Logout error:', error)
      throw error.response?.data || { success: false, message: 'Logout failed' }
    }
  },

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me/')
      return response.data
    } catch (error) {
      console.warn('Could not fetch current user:', error)
      return { isAuthenticated: false, user: null }
    }
  },
}

// User type
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

// Auth state type
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
