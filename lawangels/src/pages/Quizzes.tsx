import { useAuth } from '../contexts/AuthContext'
import { Bell, ArrowRight, ChevronRight, CheckCircle, TrendingUp, Clock, Brain } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

export default function Quizzes() {
  const { user } = useAuth()

  const quizModules = [
    {
      title: 'Constitutional Law Quick Quiz',
      course: 'Constitutional Law',
      totalQuestions: 30,
      averageScore: 78,
      attemptsTaken: 8,
      difficulty: 'Intermediate',
      estimatedTime: '20 mins',
      topics: ['Sovereignty', 'Rule of Law', 'Separation of Powers', 'Judicial Review'],
      color: 'blue',
      timesCompleted: 8,
      bestScore: 85,
    },
    {
      title: 'Contract Law Mini Quiz',
      course: 'Contract Law',
      totalQuestions: 25,
      averageScore: 74,
      attemptsTaken: 6,
      difficulty: 'Intermediate',
      estimatedTime: '18 mins',
      topics: ['Formation', 'Consideration', 'Terms', 'Breach'],
      color: 'purple',
      timesCompleted: 6,
      bestScore: 80,
    },
    {
      title: 'Property Law Quiz',
      course: 'Property Law',
      totalQuestions: 28,
      averageScore: 86,
      attemptsTaken: 10,
      difficulty: 'Intermediate',
      estimatedTime: '22 mins',
      topics: ['Registration', 'Leasehold', 'Co-ownership', 'Mortgages'],
      color: 'green',
      timesCompleted: 10,
      bestScore: 92,
    },
    {
      title: 'Criminal Law Quiz',
      course: 'Criminal Law',
      totalQuestions: 32,
      averageScore: 65,
      attemptsTaken: 4,
      difficulty: 'Advanced',
      estimatedTime: '25 mins',
      topics: ['Actus Reus', 'Mens Rea', 'Defences', 'Homicide'],
      color: 'red',
      timesCompleted: 4,
      bestScore: 72,
    },
    {
      title: 'Tort Law Quiz',
      course: 'Tort Law',
      totalQuestions: 26,
      averageScore: 0,
      attemptsTaken: 0,
      difficulty: 'Intermediate',
      estimatedTime: '20 mins',
      topics: ['Negligence', 'Defamation', 'Trespass', 'Nuisance'],
      color: 'yellow',
      timesCompleted: 0,
      bestScore: 0,
    },
    {
      title: 'Equity and Trusts Quiz',
      course: 'Equity and Trusts',
      totalQuestions: 29,
      averageScore: 0,
      attemptsTaken: 0,
      difficulty: 'Advanced',
      estimatedTime: '23 mins',
      topics: ['Trust Creation', 'Beneficiaries', 'Breach', 'Remedies'],
      color: 'indigo',
      timesCompleted: 0,
      bestScore: 0,
    },
  ]

  const recentAttempts = [
    {
      title: 'Constitutional Law Quick Quiz',
      course: 'Constitutional Law',
      score: 78,
      maxScore: 100,
      questionsCorrect: 23,
      totalQuestions: 30,
      completedAt: '2 hours ago',
      color: 'blue',
      duration: '19 mins',
    },
    {
      title: 'Property Law Quiz',
      course: 'Property Law',
      score: 86,
      maxScore: 100,
      questionsCorrect: 24,
      totalQuestions: 28,
      completedAt: '1 day ago',
      color: 'green',
      duration: '21 mins',
    },
    {
      title: 'Contract Law Mini Quiz',
      course: 'Contract Law',
      score: 74,
      maxScore: 100,
      questionsCorrect: 18,
      totalQuestions: 25,
      completedAt: '3 days ago',
      color: 'purple',
      duration: '17 mins',
    },
  ]

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              🧠 Quizzes
            </h1>
            <p className="text-gray-600">Test your knowledge with interactive quizzes and track your progress</p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-8">
        {/* Recent Attempts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-normal text-black mb-1">Recent Attempts</h2>
          <p className="text-gray-600 text-sm mb-6">Review your latest quiz performance</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {recentAttempts.map((attempt, idx) => {
              const color = colorMap[attempt.color as keyof typeof colorMap]
              const percentage = Math.round((attempt.score / attempt.maxScore) * 100)

              return (
                <div key={idx} className={`rounded-lg p-6 border border-gray-200 ${color.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className={`font-semibold ${color.text} text-sm uppercase tracking-wide`}>Quiz Attempt</h3>
                    <ChevronRight className={`w-5 h-5 ${color.text}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{attempt.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{attempt.course}</p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{attempt.score}/{attempt.maxScore}</span>
                      <span className="text-sm font-semibold text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.accent}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {attempt.questionsCorrect}/{attempt.totalQuestions} correct • {attempt.duration} • {attempt.completedAt}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Quizzes Section */}
        <div>
          <h2 className="text-2xl font-normal text-black mb-1">All Quiz Modules</h2>
          <p className="text-gray-600 text-sm mb-6">Take quizzes to test your knowledge across all courses</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizModules.map((quiz, idx) => {
              const color = colorMap[quiz.color as keyof typeof colorMap]

              return (
                <div
                  key={idx}
                  className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                          {quiz.course}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Questions</span>
                        <span className="font-semibold text-gray-900">{quiz.totalQuestions}</span>
                      </div>

                      {quiz.attemptsTaken > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Avg Score</p>
                              <p className="text-lg font-semibold text-gray-900">{quiz.averageScore}%</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Best Score</p>
                              <p className="text-lg font-semibold text-gray-900">{quiz.bestScore}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Times Completed</span>
                            <span className="font-semibold text-gray-900">{quiz.timesCompleted}</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty</span>
                        <span className="font-semibold text-gray-900">{quiz.difficulty}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Est. Time</span>
                        <span className="font-semibold text-gray-900">{quiz.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Topics Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {quiz.topics.map((topic, tidx) => (
                          <span
                            key={tidx}
                            className={`text-xs px-3 py-1 rounded-full ${color.bg} ${color.text} font-medium`}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      {quiz.attemptsTaken > 0 ? 'Retake Quiz' : 'Start Quiz'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance Stats Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-normal text-black mb-6">Your Quiz Stats</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quizzes Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">28</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">This month</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Accuracy</p>
                  <p className="text-2xl font-semibold text-gray-900">79%</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium">+4% improvement</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Time per Quiz</p>
                  <p className="text-2xl font-semibold text-gray-900">20m</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">Consistent pace</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quiz Streak</p>
                  <p className="text-2xl font-semibold text-gray-900">5 days</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium">Keep going!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
