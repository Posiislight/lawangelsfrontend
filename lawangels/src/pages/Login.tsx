import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle } from 'lucide-react'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

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
      // Redirect to mock test start page on successful login
      navigate('/mock-test-start')
    } catch (err) {
      // Error is handled by context
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-worksans">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-12 mt-10">
          <div className="flex items-center justify-center gap-1 mb-4">
            <img src={logo} alt="Law Angels" className="h-12 w-20 -mr-4" />
            <img src={logotext} alt="Law Angels" className="h-8 mt-2" />
          </div>
          <h1 className="text-3xl font-medium text-[#111418] mb-2">Create your account</h1>
          <p className="text-[#617289] text-base">Start your journey to becoming a qualified solicitor</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 -mt-4">
          {(error || validationError) && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#111418] mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Konrad Tibert"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base bg-[#f8f9fa]"
                disabled={isLoading}
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-[#111418] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="konrde@example.com"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base bg-[#f8f9fa]"
                disabled={isLoading}
                autoComplete="email"
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
                placeholder="Create a strong password"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base bg-[#f8f9fa]"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <p className="text-xs text-[#617289] mt-2">Minimum 8 characters</p>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0AB5FF] hover:bg-[#0077DD] text-white font-semibold py-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating account...' : 'Continue'}
              {!isLoading && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-[#E2E8F0]"></div>
            <span className="text-sm text-[#617289]">Or continue with</span>
            <div className="flex-1 border-t border-[#E2E8F0]"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="w-full border border-[#E2E8F0] text-[#111418] font-semibold py-3 rounded-lg hover:bg-[#f8f9fa] transition flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <text x="0" y="20" className="text-2xl">G</text>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-[#617289] mt-6 text-sm mb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#089AD9] font-normal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
