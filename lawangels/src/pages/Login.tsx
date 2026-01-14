import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
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
    if (!formData.email.trim()) {
      setValidationError('Email is required')
      return
    }
    if (!formData.password.trim()) {
      setValidationError('Password is required')
      return
    }

    try {
      await login(formData.email, formData.password)
      // Redirect to dashboard on successful login
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by context
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-worksans relative">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-2xl">
        {/* Header with Logo */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <img src={logo} alt="Law Angels" className="h-8" />
          <img src={logotext} alt="Law Angels" className="h-6" />
        </div>

        {/* Auth Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Link to="/register" className="px-6 py-2 text-[#617289] font-medium hover:text-[#111418] transition">
            Sign Up
          </Link>
          <button className="px-6 py-2 rounded-lg font-medium transition bg-white border border-[#E2E8F0]">
            Log In
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#111418] mb-2">Welcome back</h1>
          <p className="text-[#617289]">Sign in to continue your learning journey</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
          {(error || validationError) && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address / Username */}
            <div>
              <label className="block text-sm font-medium text-[#111418] mb-2">
                Email Address / Username
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com or username"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#111418] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-[#0089FF] hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0089FF] hover:bg-[#0077DD] disabled:bg-[#0089FF]/50 text-white font-semibold py-3 rounded-full transition mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-[#617289] mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0089FF] hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
