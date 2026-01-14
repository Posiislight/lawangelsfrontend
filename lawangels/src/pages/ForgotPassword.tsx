import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { authApi } from '../services/authApi'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('Please enter your email address')
            return
        }

        setIsLoading(true)

        try {
            await authApi.forgotPassword(email)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4 font-worksans">
                <div className="w-full max-w-md text-center">
                    {/* Header with Logo */}
                    <div className="flex justify-center items-center gap-2 mb-8">
                        <img src={logo} alt="Law Angels" className="h-8" />
                        <img src={logotext} alt="Law Angels" className="h-6" />
                    </div>

                    <div className="bg-green-50 rounded-xl border border-green-200 p-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
                        <p className="text-gray-600 mb-6">
                            If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            The link will expire in 24 hours. Check your spam folder if you don't see the email.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-[#0089FF] hover:underline font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 font-worksans relative">
            {/* Back to Login Link */}
            <Link
                to="/login"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Login</span>
            </Link>

            <div className="w-full max-w-md">
                {/* Header with Logo */}
                <div className="flex justify-center items-center gap-2 mb-8">
                    <img src={logo} alt="Law Angels" className="h-8" />
                    <img src={logotext} alt="Law Angels" className="h-6" />
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-[#0089FF]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#111418] mb-2">Forgot your password?</h1>
                    <p className="text-[#617289]">
                        No worries! Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
                    {error && (
                        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Address */}
                        <div>
                            <label className="block text-sm font-medium text-[#111418] mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base"
                                disabled={isLoading}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0089FF] hover:bg-[#0077DD] disabled:bg-[#0089FF]/50 text-white font-semibold py-3 rounded-full transition flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>

                {/* Back to Login Link */}
                <p className="text-center text-[#617289] mt-6 text-sm">
                    Remember your password?{' '}
                    <Link to="/login" className="text-[#0089FF] hover:underline font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
