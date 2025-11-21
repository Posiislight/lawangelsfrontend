import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuth()
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
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
    if (!formData.firstName.trim()) {
      setValidationError('First name is required')
      return
    }
    if (!formData.lastName.trim()) {
      setValidationError('Last name is required')
      return
    }
    if (!formData.email.trim()) {
      setValidationError('Email is required')
      return
    }
    if (!formData.username.trim()) {
      setValidationError('Username is required')
      return
    }
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.firstName,
        formData.lastName
      )
      setSuccess(true)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      })
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
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
          <p className="text-[#CAD5E2]">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success && (
            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Registration successful!</p>
                <p className="text-sm text-green-800">Redirecting to login...</p>
              </div>
            </div>
          )}

          {(error || validationError) && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#314158] mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                  placeholder="John"
                  disabled={isLoading}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#314158] mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                  placeholder="Doe"
                  disabled={isLoading}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#314158] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                placeholder="john@example.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

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
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                placeholder="john_doe"
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
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <p className="text-xs text-[#45556C] mt-1">At least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#314158] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E17100]"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0F172B] to-[#1a1f3a] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-[#314158] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E17100] font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
