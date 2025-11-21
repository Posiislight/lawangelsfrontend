import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [validationError, setValidationError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (validationError) setValidationError('')
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Validation
    if (!formData.username.trim()) {
      setValidationError('Username is required')
      return
    }
    if (!formData.password.trim()) {
      setValidationError('Password is required')
      return
    }

    try {
      await login(formData.username, formData.password)
      // Redirect to mock exam on successful login
      navigate('/mock-exam')
    } catch (err) {
      // Error is handled by context
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172B] to-[#1D293D] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Law Angels</h1>
          <p className="text-[#CAD5E2]">Welcome back</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {(error || validationError) && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#314158] mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100] text-base"
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#314158] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100] text-base"
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#E17100] to-[#FE9A00] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-[#314158] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#E17100] font-semibold hover:underline">
              Create one here
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 text-center">
          <p className="text-[#CAD5E2] text-sm mb-3">Demo Credentials:</p>
          <div className="bg-[#1D293D] rounded-lg p-4 text-left text-xs text-[#CAD5E2] space-y-1">
            <p>Username: <span className="text-[#FE9A00]">testuser</span></p>
            <p>Password: <span className="text-[#FE9A00]">testpass123</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
