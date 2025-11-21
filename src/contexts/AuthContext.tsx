import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../services/authApi'
import type { AuthState } from '../services/authApi'

interface AuthContextType extends AuthState {
  register: (username: string, email: string, password: string, password2: string, firstName: string, lastName: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getCurrentUser()
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } else {
          setState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkAuth()
  }, [])

  const register = async (username: string, email: string, password: string, password2: string, firstName: string, lastName: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await authApi.register(username, email, password, password2, firstName, lastName)
      setState(prev => ({ ...prev, isLoading: false }))
      // User is registered but not logged in, they need to login
    } catch (error: any) {
      const errorMessage = error.response?.data?.username?.[0] || error.response?.data?.detail || 'Registration failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }

  const login = async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.login(username, password)
      const user = response.user
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = 
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.detail || 
        error.response?.data?.error ||
        error.message ||
        'Login failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      await authApi.logout()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed',
      }))
      throw error
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
