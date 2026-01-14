import { ArrowRight, Clock, FileText, Flag, Zap, Target, Award } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function Practice() {
  const navigate = useNavigate()

  const handleStartMockTest = () => {
    // Navigate to mock questions page
    navigate('/mock-questions')
  }

  const handleStartQuiz = () => {
    // Navigate to quizzes page
    navigate('/quizzes')
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-6">
        <div className="relative flex flex-col md:block text-center">
          <Link
            to="/dashboard"
            className="self-start mb-2 md:mb-0 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm md:text-base"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Practice Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your practice mode</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 md:mb-3">Test Your Knowledge</h2>
          <p className="text-gray-600 text-sm md:text-base">Choose between mock test or quizez to sharpen your skills</p>
        </div>

        {/* Practice Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Mock Test Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 border border-blue-200">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3">Mock Test</h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              Test simulation with timed questions and detailed analytics
            </p>

            {/* Features */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm md:text-base">
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>Timed exam conditions</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>90 comprehensive questions</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Flag className="w-5 h-5 text-blue-500" />
                <span>Flag & review questions</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-end gap-4 md:gap-8 mb-6 overflow-x-auto">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">90</p>
                <p className="text-xs md:text-sm text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">150</p>
                <p className="text-xs md:text-sm text-gray-500">Minutes</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-blue-600">Speed Test</p>
                <p className="text-xs md:text-sm text-gray-500">Mode</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartMockTest}
              className="flex items-center justify-between w-full text-blue-600 font-semibold hover:text-blue-700 transition-colors group text-sm md:text-base"
            >
              <span>Start Mock Test</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quiz Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 md:p-8 border border-orange-200">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3">Quiz</h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              Fun, interactive practice with points, streaks, and instant feedback
            </p>

            {/* Features */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm md:text-base">
              <div className="flex items-center gap-3 text-gray-700">
                <Award className="w-5 h-5 text-orange-500" />
                <span>Earn points and build streaks</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Zap className="w-5 h-5 text-orange-500" />
                <span>Quick 10-20 question sets</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Target className="w-5 h-5 text-orange-500" />
                <span>Immediate feedback on answers</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-end gap-4 md:gap-8 mb-6 overflow-x-auto">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-orange-500">10-20</p>
                <p className="text-xs md:text-sm text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-orange-500">15</p>
                <p className="text-xs md:text-sm text-gray-500">Minutes</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-orange-500">Fun</p>
                <p className="text-xs md:text-sm text-gray-500">Mode</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartQuiz}
              className="flex items-center justify-between w-full text-orange-500 font-semibold hover:text-orange-600 transition-colors group text-sm md:text-base"
            >
              <span>Start Quiz</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Practice Questions Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-100/50 rounded-2xl p-6 md:p-8 border border-emerald-200">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3">Practice Questions</h3>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              Topic-based practice with instant feedback and detailed explanations
            </p>

            {/* Features */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm md:text-base">
              <div className="flex items-center gap-3 text-gray-700">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>Organized by course and topic</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Target className="w-5 h-5 text-emerald-500" />
                <span>Instant feedback on answers</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Flag className="w-5 h-5 text-emerald-500" />
                <span>Detailed explanations</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-end gap-4 md:gap-8 mb-6 overflow-x-auto">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-emerald-600">1000+</p>
                <p className="text-xs md:text-sm text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-emerald-600">12</p>
                <p className="text-xs md:text-sm text-gray-500">Topics</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-emerald-600">Learn</p>
                <p className="text-xs md:text-sm text-gray-500">Mode</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/practice-questions')}
              className="flex items-center justify-between w-full text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group text-sm md:text-base"
            >
              <span>Start Practice</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
