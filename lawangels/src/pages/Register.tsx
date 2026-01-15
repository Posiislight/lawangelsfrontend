import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { billingApi } from '../services/billingApi'
import { AlertCircle, Target, RefreshCw, BookOpen, Plus, Eye, EyeOff, ArrowLeft, Camera } from 'lucide-react'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'
import avatar1 from '../assets/avatars/Frame 23.png'
import avatar2 from '../assets/avatars/Frame 24.png'
import avatar3 from '../assets/avatars/Frame 25.png'
import avatar4 from '../assets/avatars/Frame 26.png'
import avatar5 from '../assets/avatars/Frame 27.png'
import avatar6 from '../assets/avatars/Frame 29.png'

type StudyGoal = 'pass' | 'refresh' | 'practice'
type StudyTime = '30-min' | '1-hour' | '2-hours' | '3plus-hours'

interface AvatarOption {
  id: string
  name: string
  image?: string
}

const avatarOptions: AvatarOption[] = [
  { id: 'custom', name: 'Custom' },
  { id: 'avatar1', name: 'Avatar 1', image: avatar1 },
  { id: 'avatar2', name: 'Avatar 2', image: avatar2 },
  { id: 'avatar3', name: 'Avatar 3', image: avatar3 },
  { id: 'avatar4', name: 'Avatar 4', image: avatar4 },
  { id: 'avatar5', name: 'Avatar 5', image: avatar5 },
  { id: 'avatar6', name: 'Avatar 6', image: avatar6 },
]

export default function Register() {
  const navigate = useNavigate()
  const { login, register, isLoading, error, clearError } = useAuth()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Step 1: Account Info
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2: Preferences
  const [studyGoal, setStudyGoal] = useState<StudyGoal | null>(null)
  const [studyTime, setStudyTime] = useState<StudyTime | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle custom avatar upload
  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationError('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Image must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setCustomAvatarPreview(reader.result as string)
        setSelectedAvatar('custom')
        if (validationError) setValidationError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const isStep1Valid = fullName && email && password && password.length >= 8
  const isStep2Valid = studyGoal && studyTime && selectedAvatar
  const isStep3Valid = true  // Step 3 just shows price, no validation needed

  const handleNextStep = () => {
    setValidationError('')

    if (step === 1) {
      if (!fullName.trim()) {
        setValidationError('Full name is required')
        return
      }
      if (!email.trim()) {
        setValidationError('Email is required')
        return
      }
      if (!password.trim()) {
        setValidationError('Password is required')
        return
      }
      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!studyGoal) {
        setValidationError('Please select a study goal')
        return
      }
      if (!studyTime) {
        setValidationError('Please select daily study time')
        return
      }
      if (!selectedAvatar) {
        setValidationError('Please choose a profile icon')
        return
      }
      setStep(3)
    } else if (step === 3) {
      // Step 3 just shows the price - clicking "Complete Setup" triggers registration + Stripe checkout
      handleSubmit()
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setValidationError('')
    }
  }

  const handleSubmit = async () => {
    try {
      // Parse full name into first/last name
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Register the user
      await register(email, email, password, password, firstName, lastName)

      // Login the user after registration
      await login(email, password)

      // Redirect to Stripe checkout for payment
      try {
        await billingApi.redirectToCheckout()
      } catch (stripeError) {
        // If Stripe checkout fails, still navigate to dashboard
        // User can pay later from billing page
        navigate('/dashboard')
      }
    } catch (err) {
      // Registration or login failed - error is handled by context
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-worksans py-8 relative">
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
          <button className="px-6 py-2 rounded-lg font-medium transition bg-white border border-[#E2E8F0]">
            Sign Up
          </button>
          <Link to="/login" className="px-6 py-2 text-[#617289] font-medium hover:text-[#111418] transition">
            Log In
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#0089FF]' : i < step ? 'bg-[#0089FF]' : 'bg-[#E2E8F0]'
                  }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-[#617289]">Step {step} of 3</p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-[#111418] mb-2">Create Your Account</h1>
              <p className="text-[#617289]">Start your SQE preparation journey today</p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-[#111418] mb-2">Personalize Your Learning</h1>
              <p className="text-[#617289]">Help us create the perfect study experience</p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-[#111418] mb-2">Billing & Payment</h1>
              <p className="text-[#617289]">Required for subscription management</p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
          {(error || validationError) && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || validationError}</p>
            </div>
          )}

          {/* Step 1: Account Information */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#111418] mb-2">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Korode Tibert"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (validationError) setValidationError('')
                      if (error) clearError()
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] focus:border-transparent text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-[#111418] mb-2">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (validationError) setValidationError('')
                      if (error) clearError()
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] focus:border-transparent text-base"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#111418] mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (validationError) setValidationError('')
                      if (error) clearError()
                    }}
                    className="w-full pl-12 pr-12 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089FF] focus:border-transparent text-base"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617289] hover:text-[#111418]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#617289] mt-2">At least 8 characters with uppercase, lowercase, and numbers</p>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Study Goal */}
              <div>
                <h2 className="text-lg font-semibold text-[#111418] mb-4">What's your main study goal?</h2>
                <div className="space-y-3">
                  {[
                    { value: 'pass', label: 'Pass the exam', icon: Target },
                    { value: 'refresh', label: 'Refresh my knowledge', icon: RefreshCw },
                    { value: 'practice', label: 'Practice with mock exams', icon: BookOpen },
                  ].map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStudyGoal(option.value as StudyGoal)
                          if (validationError) setValidationError('')
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 bg-white ${studyGoal === option.value
                          ? 'border-[#0089FF] bg-[#F0F8FF]'
                          : 'border-[#E2E8F0] hover:border-[#0089FF]/30'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${studyGoal === option.value ? 'bg-[#0089FF]' : 'bg-[#F3F4F6]'
                          }`}>
                          <IconComponent className={`w-5 h-5 ${studyGoal === option.value ? 'text-white' : 'text-[#111418]'}`} />
                        </div>
                        <span className="font-medium text-[#111418]">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Study Time */}
              <div>
                <h2 className="text-lg font-semibold text-[#111418] mb-4">How much time can you study daily?</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: '30-min', label: '30 min' },
                    { value: '1-hour', label: '1 hour' },
                    { value: '2-hours', label: '2 hours' },
                    { value: '3plus-hours', label: '3+ hours' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStudyTime(option.value as StudyTime)
                        if (validationError) setValidationError('')
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-center font-medium text-sm ${studyTime === option.value
                        ? 'border-[#0089FF] bg-[#F0F8FF] text-[#0089FF]'
                        : 'border-[#E2E8F0] text-[#617289] hover:border-[#0089FF]/30'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <h2 className="text-lg font-semibold text-[#111418] mb-4">Choose your profile icon</h2>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-4 justify-center">
                  {/* Custom upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all overflow-hidden p-0 ${selectedAvatar === 'custom'
                      ? 'border-[#0089FF] ring-4 ring-[#0089FF]/10'
                      : 'border-[#E2E8F0] hover:border-[#0089FF]/30 border-dashed'
                      }`}
                    title="Upload custom photo"
                  >
                    {customAvatarPreview ? (
                      <img src={customAvatarPreview} alt="Custom avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Camera className="w-5 h-5 text-[#0089FF]" />
                        <Plus className="w-3 h-3 text-[#0089FF] -mt-1" />
                      </div>
                    )}
                  </button>

                  {/* Preset avatars */}
                  {avatarOptions.filter(a => a.id !== 'custom').map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(avatar.id)
                        if (validationError) setValidationError('')
                      }}
                      className={`w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all overflow-hidden p-0 ${selectedAvatar === avatar.id
                        ? 'border-[#0089FF] ring-4 ring-[#0089FF]/10'
                        : 'border-[#E2E8F0] hover:border-[#0089FF]/30'
                        }`}
                      title={avatar.name}
                    >
                      <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#617289] text-center mt-4">
                  {customAvatarPreview ? 'Custom photo selected' : 'Click the camera icon to upload your own photo'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Payment - Stripe Integration */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Subscription Plan */}
              <div className="bg-gradient-to-br from-[#F0F8FF] to-white p-6 rounded-xl border-2 border-[#0089FF]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#0089FF] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111418]">Annual Subscription</h3>
                    <p className="text-sm text-[#617289]">Full access to all SQE preparation materials</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-[#111418]">£750</span>
                  <span className="text-[#617289]">/ year</span>
                </div>

                <ul className="space-y-2 mb-4">
                  {[
                    'Unlimited practice questions',
                    'Video tutorials library',
                    'AI-powered study assistant',
                    'Mock exams with feedback',
                    'Progress tracking',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[#617289]">
                      <svg className="w-4 h-4 text-[#0089FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Security Notice */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-[#617289]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-[#617289]">
                  Secure payment powered by <span className="font-semibold">Stripe</span>.
                  You'll be redirected to complete payment.
                </p>
              </div>

              {/* Terms Agreement */}
              <p className="text-xs text-[#617289] text-center">
                By completing this purchase, you agree to our{' '}
                <Link to="/terms" className="text-[#0089FF] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-[#0089FF] hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-between mt-8">
          <button
            onClick={handlePrevStep}
            disabled={step === 1 || isLoading}
            className="px-6 py-3 rounded-lg border border-[#E2E8F0] font-semibold text-[#111418] hover:bg-[#f8f9fa] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : !isStep3Valid || isLoading}
            className="px-8 py-3 rounded-lg bg-[#0089FF] hover:bg-[#0077DD] disabled:bg-[#0089FF]/50 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Creating account...' : step === 3 ? 'Complete Setup' : 'Continue'}
            {!isLoading && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-[#617289] mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0089FF] hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
