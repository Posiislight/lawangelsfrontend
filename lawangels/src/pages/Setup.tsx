import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, RefreshCw, BookOpen, Plus } from 'lucide-react'
import avatar1 from '../assets/avatars/Frame 23.png'
import avatar2 from '../assets/avatars/Frame 24.png'
import avatar3 from '../assets/avatars/Frame 25.png'
import avatar4 from '../assets/avatars/Frame 26.png'
import avatar5 from '../assets/avatars/Frame 27.png'
import avatar6 from '../assets/avatars/Frame 29.png'

type StudyGoal = 'pass' | 'refresh' | 'practice'
type ExamTiming = 'within-3' | '3-6' | '6-12' | 'unsure'

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

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [examTiming, setExamTiming] = useState<ExamTiming | null>(null)
  const [studyGoal, setStudyGoal] = useState<StudyGoal | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)

  const handleNext = () => {
    if (step === 1 && examTiming) {
      setStep(2)
    } else if (step === 2 && studyGoal && selectedAvatar) {
      setStep(3)
    } else if (step === 3) {
      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const progressPercent = (() => {
    let progress = 0
    if (examTiming) progress += 33
    if (studyGoal) progress += 33
    if (selectedAvatar) progress += 34
    return Math.min(progress, 100)
  })()

  return (
    <div className="min-h-screen bg-white font-worksans py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[#617289]">Step {step} of 3</span>
            <span className="text-sm text-[#617289]">{progressPercent.toFixed(0)}% complete</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className="bg-[#0089FF] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#111418] mb-2">Personalize your experience</h1>
          <p className="text-[#617289]">Help us tailor your learning journey</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8">
          {/* When is your SQE exam? */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#111418] mb-6">When is your SQE exam?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'within-3', label: 'Within 3 months' },
                { value: '3-6', label: '3-6 months' },
                { value: '6-12', label: '6-12 months' },
                { value: 'unsure', label: 'Not sure yet' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExamTiming(option.value as ExamTiming)}
                  className={`p-4 rounded-lg border-2 transition-all font-medium text-center bg-white ${
                    examTiming === option.value
                      ? 'border-[#0089FF]'
                      : 'border-[#E2E8F0] hover:border-[#0089FF]/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* What's your main study goal? */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#111418] mb-6">What's your main study goal?</h2>
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
                    onClick={() => setStudyGoal(option.value as StudyGoal)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 bg-white ${
                      studyGoal === option.value
                        ? 'border-[#0089FF]'
                        : 'border-[#E2E8F0] hover:border-[#0089FF]/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-black" />
                    </div>
                    <span className="font-medium text-[#111418]">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Choose your profile icon */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#111418] mb-6">Choose your profile icon</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden p-0 ${
                    selectedAvatar === avatar.id
                      ? 'border-[#0089FF]'
                      : 'border-[#E2E8F0] hover:border-[#0089FF]/30'
                  }`}
                  title={avatar.name}
                >
                  {avatar.image ? (
                    <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                  ) : (
                    <Plus className="w-6 h-6 text-[#0089FF]" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#617289] text-center mt-4">Custom</p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-[#617289] text-center mt-8">
          You can always update these preferences later in your account settings
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-between mt-10">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-lg border border-[#E2E8F0] font-semibold text-[#111418] hover:bg-[#f8f9fa] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={step === 1 ? !examTiming : step === 2 ? !studyGoal || !selectedAvatar : false}
            className="px-8 py-3 rounded-lg bg-[#0089FF] hover:bg-[#0077DD] text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {step === 3 ? 'Complete Setup' : 'Continue'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
