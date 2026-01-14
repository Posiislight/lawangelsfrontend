import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../services/authApi'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const uid = searchParams.get('uid')
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Check if we have the required parameters
    useEffect(() => {
        if (!uid || !token) {
            setError('Invalid reset link. Please request a new password reset.')
        }
    }, [uid, token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!password.trim()) {
            setError('Please enter a new password')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (password !== password2) {
            setError('Passwords do not match')
            return
        }

        if (!uid || !token) {
            setError('Invalid reset link. Please request a new password reset.')
            return
        }

        setIsLoading(true)

        try {
            await authApi.resetPassword(uid, token, password, password2)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link may have expired.')
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">Password reset successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#0089FF] hover:bg-[#0077DD] text-white font-semibold py-3 rounded-full transition"
                        >
                            Sign In
                        </button>
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
                        <Lock className="w-8 h-8 text-[#0089FF]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#111418] mb-2">Set new password</h1>
                    <p className="text-[#617289]">
                        Enter your new password below. Make sure it's at least 8 characters.
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
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#111418] mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base pr-12"
                                    disabled={isLoading || !uid || !token}
                                    autoComplete="new-password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#111418] mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword2 ? 'text' : 'password'}
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] text-base pr-12"
                                    disabled={isLoading || !uid || !token}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword2(!showPassword2)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !uid || !token}
                            className="w-full bg-[#0089FF] hover:bg-[#0077DD] disabled:bg-[#0089FF]/50 text-white font-semibold py-3 rounded-full transition flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>

                {/* Request new link */}
                <p className="text-center text-[#617289] mt-6 text-sm">
                    Link expired?{' '}
                    <Link to="/forgot-password" className="text-[#0089FF] hover:underline font-semibold">
                        Request a new one
                    </Link>
                </p>
            </div>
        </div>
    )
}
