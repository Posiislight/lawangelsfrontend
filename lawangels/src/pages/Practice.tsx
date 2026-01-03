import { ArrowRight, Clock, FileText, Flag, Zap, Target, Award } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function Practice() {
  const navigate = useNavigate()

  const handleStartMockTest = () => {
    // Navigate to topic selection for mock test
    navigate('/practice/mock-test')
  }

  const handleStartQuiz = () => {
    // Navigate to topic selection for quiz
    navigate('/practice/quiz')
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="text-center">
          <Link
            to="/dashboard"
            className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Practice Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your practice mode</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">Test Your Knowledge</h2>
          <p className="text-gray-600">Choose between mock test or quizez to sharpen your skills</p>
        </div>

        {/* Practice Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mock Test Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Mock Test</h3>
            <p className="text-gray-600 mb-6">
              Test simulation with timed questions and detailed analytics
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
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
            <div className="flex items-end gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-blue-600">90</p>
                <p className="text-sm text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">150</p>
                <p className="text-sm text-gray-500">Minutes</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-blue-600">Speed Test</p>
                <p className="text-sm text-gray-500">Mode</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartMockTest}
              className="flex items-center justify-between w-full text-blue-600 font-semibold hover:text-blue-700 transition-colors group"
            >
              <span>Start Mock Test</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quiz Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-8 border border-orange-200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Quiz</h3>
            <p className="text-gray-600 mb-6">
              Fun, interactive practice with points, streaks, and instant feedback
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
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
            <div className="flex items-end gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-orange-500">10-20</p>
                <p className="text-sm text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-500">15</p>
                <p className="text-sm text-gray-500">Minutes</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-orange-500">Fun</p>
                <p className="text-sm text-gray-500">Mode</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartQuiz}
              className="flex items-center justify-between w-full text-orange-500 font-semibold hover:text-orange-600 transition-colors group"
            >
              <span>Start Quiz</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
