import { useAuth } from '../contexts/AuthContext'
import { Bell, ArrowRight, ChevronRight, CheckCircle, TrendingUp, Clock, Brain, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { quizApi, type Exam, type ExamAttempt } from '../services/quizApi'
import { dashboardApi, type UserStats } from '../services/dashboardApi'

interface QuizWithStats extends Exam {
  attemptsTaken: number
  averageScore: number
  bestScore: number
  color: string
}

interface RecentAttempt {
  id: number
  title: string
  course: string
  score: number
  maxScore: number
  questionsCorrect: number
  totalQuestions: number
  completedAt: string
  color: string
  duration: string
}

export default function Quizzes() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [exams, attempts, stats] = await Promise.all([
          quizApi.getExams(),
          quizApi.getAttempts(),
          dashboardApi.getUserStats(),
        ])

        setUserStats(stats)

        // Create a map of exam attempts
        const attemptsByExam = new Map<number, ExamAttempt[]>()
        attempts.forEach(attempt => {
          const examId = attempt.exam_id || attempt.exam?.id
          if (examId) {
            if (!attemptsByExam.has(examId)) {
              attemptsByExam.set(examId, [])
            }
            attemptsByExam.get(examId)!.push(attempt)
          }
        })

        // Enrich exams with attempt stats
        const colors = ['blue', 'purple', 'green', 'red', 'yellow', 'indigo']
        const enrichedQuizzes: QuizWithStats[] = exams.map((exam, idx) => {
          const examAttempts = attemptsByExam.get(exam.id) || []
          const completedAttempts = examAttempts.filter(a => a.status === 'completed')
          const scores = completedAttempts
            .map(a => a.score)
            .filter((s): s is number => s !== null)

          return {
            ...exam,
            attemptsTaken: completedAttempts.length,
            averageScore: scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0,
            bestScore: scores.length > 0 ? Math.max(...scores) : 0,
            color: colors[idx % colors.length],
          }
        })

        setQuizzes(enrichedQuizzes)

        // Create recent attempts list
        const recentList: RecentAttempt[] = attempts
          .filter(a => a.status === 'completed' && a.score !== null)
          .slice(0, 6)
          .map((attempt, idx) => {
            const exam = exams.find(e => e.id === (attempt.exam_id || attempt.exam?.id))
            const questionsCorrect = exam
              ? Math.round(((attempt.score || 0) / 100) * exam.total_questions)
              : 0
            const duration = attempt.time_spent_seconds
              ? `${Math.round(attempt.time_spent_seconds / 60)} mins`
              : 'N/A'

            return {
              id: attempt.id,
              title: exam?.title || `Exam #${attempt.exam_id}`,
              course: exam ? formatSubjectName(exam.subject) : 'Unknown',
              score: attempt.score || 0,
              maxScore: 100,
              questionsCorrect,
              totalQuestions: exam?.total_questions || 0,
              completedAt: formatRelativeTime(attempt.ended_at || attempt.started_at),
              color: colors[idx % colors.length],
              duration,
            }
          })

        setRecentAttempts(recentList)
      } catch (error) {
        console.error('Error fetching quizzes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatSubjectName = (subject: string): string => {
    const subjectNames: Record<string, string> = {
      'land_law': 'Land Law',
      'trusts': 'Trusts & Equity',
      'property': 'Property Transactions',
      'criminal': 'Criminal Law',
      'commercial': 'Commercial Law',
      'tax': 'Tax Law',
      'professional': 'Professional Conduct',
      'wills': 'Wills & Administration',
      'mixed': 'Mixed',
    }
    return subjectNames[subject] || subject
  }

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading quizzes...</span>
          </div>
        ) : (
          <>
            {/* Recent Attempts Section */}
            {recentAttempts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-normal text-black mb-1">Recent Attempts</h2>
                <p className="text-gray-600 text-sm mb-6">Review your latest quiz performance</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {recentAttempts.slice(0, 3).map((attempt) => {
                    const color = colorMap[attempt.color as keyof typeof colorMap]
                    const percentage = Math.round((attempt.score / attempt.maxScore) * 100)

                    return (
                      <div key={attempt.id} className={`rounded-lg p-6 border border-gray-200 ${color.bg} hover:shadow-md transition-shadow cursor-pointer`}>
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
            )}

            {/* All Quizzes Section */}
            <div>
              <h2 className="text-2xl font-normal text-black mb-1">All Quiz Modules</h2>
              <p className="text-gray-600 text-sm mb-6">Take quizzes to test your knowledge across all courses</p>

              {quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.map((quiz) => {
                    const color = colorMap[quiz.color as keyof typeof colorMap]

                    return (
                      <div
                        key={quiz.id}
                        className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                                {formatSubjectName(quiz.subject)}
                              </p>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                            </div>
                          </div>

                          <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Questions</span>
                              <span className="font-semibold text-gray-900">{quiz.total_questions}</span>
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
                                  <span className="font-semibold text-gray-900">{quiz.attemptsTaken}</span>
                                </div>
                              </>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Duration</span>
                              <span className="font-semibold text-gray-900">{quiz.duration_minutes} mins</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Pass Score</span>
                              <span className="font-semibold text-gray-900">{quiz.passing_score_percentage}%</span>
                            </div>
                          </div>

                          <a
                            href={`/quiz/${quiz.id}`}
                            className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                          >
                            {quiz.attemptsTaken > 0 ? 'Retake Quiz' : 'Start Quiz'}
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                  <p className="text-gray-600 mb-4">No quizzes available yet</p>
                  <p className="text-sm text-gray-500">Check back later for new quizzes</p>
                </div>
              )}
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
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.completedExams || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Total attempts</p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overall Accuracy</p>
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.averageScore || 0}%</p>
                    </div>
                  </div>
                  <p className={`text-xs ${userStats?.averageScore && userStats.averageScore >= 70 ? 'text-green-600' : 'text-gray-600'} font-medium`}>
                    {userStats?.averageScore && userStats.averageScore >= 70 ? 'Above passing!' : 'Keep practicing'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Study Time</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {userStats?.totalTimeSpentMinutes
                          ? `${Math.round(userStats.totalTimeSpentMinutes / 60)}h`
                          : '0h'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">In quizzes</p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pass Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.passRate || 0}%</p>
                    </div>
                  </div>
                  <p className={`text-xs ${userStats?.passRate && userStats.passRate >= 70 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                    {userStats?.passRate && userStats.passRate >= 70 ? 'Great job!' : 'Keep going!'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
