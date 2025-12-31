import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import type { UserStats, ProgressData } from '../services/dashboardApi'


interface ExamProgress {
  id: number
  title: string
  progress: number
  completed: number
  total: number
  subject: string
  lastAccessed: string
  score: number | null
}

// Helper to fetch optimized progress page data
const fetchProgressPageData = async (): Promise<{
  userStats: UserStats;
  examProgress: ExamProgress[];
  progressBySubject: ProgressData[];
}> => {
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:8000/api'
    return 'https://quiz-backend.onrender.com/api'
  }

  const token = localStorage.getItem('authToken')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${getApiBaseUrl()}/dashboard/progress_page/`, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()

  // Transform the data - format relative times on the frontend
  const examProgress: ExamProgress[] = (data.examProgress || []).map((exam: any) => ({
    ...exam,
    lastAccessed: exam.lastAccessed ? formatRelativeTimeStatic(exam.lastAccessed) : 'Unknown',
  }))

  return {
    userStats: data.userStats,
    examProgress,
    progressBySubject: data.progressBySubject || [],
  }
}

// Static formatRelativeTime helper
const formatRelativeTimeStatic = (dateString: string): string => {
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

export default function Progress() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [examProgress, setExamProgress] = useState<ExamProgress[]>([])
  const [progressBySubject, setProgressBySubject] = useState<ProgressData[]>([])

  // OPTIMIZED: Single API call instead of 3 separate calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchProgressPageData()
        setUserStats(data.userStats)
        setExamProgress(data.examProgress)
        setProgressBySubject(data.progressBySubject)
      } catch (error) {
        console.error('Error fetching progress data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return { bg: 'bg-green-500', text: 'text-green-600' }
    if (progress >= 50) return { bg: 'bg-blue-500', text: 'text-blue-600' }
    if (progress >= 25) return { bg: 'bg-yellow-500', text: 'text-yellow-600' }
    return { bg: 'bg-orange-500', text: 'text-orange-600' }
  }

  // Calculate overall progress from user stats
  const overallProgress = userStats?.completedExams && userStats?.totalExams
    ? Math.round((userStats.completedExams / userStats.totalExams) * 100)
    : 0

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">Progress Tracker</h1>
            <p className="text-sm text-gray-600 mt-1">Track your learning journey and exam performance</p>
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading progress data...</span>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                <p className="text-3xl font-semibold text-gray-900 mb-3">{overallProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Exams Completed</p>
                <p className="text-3xl font-semibold text-gray-900 mb-3">{userStats?.completedExams || 0}</p>
                <p className="text-xs text-gray-500">{userStats?.totalExams || 0} total attempts</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Study Streak</p>
                <p className="text-3xl font-semibold text-gray-900 mb-3">{userStats?.currentStreak || 0} days</p>
                <p className="text-xs text-gray-500">
                  Last active: {userStats?.lastActiveDate ? formatRelativeTimeStatic(userStats.lastActiveDate) : 'Never'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Total Study Time</p>
                <p className="text-3xl font-semibold text-gray-900 mb-3">
                  {formatTimeSpent(userStats?.totalTimeSpentMinutes || 0)}
                </p>
                <p className="text-xs text-gray-500">Average score: {userStats?.averageScore || 0}%</p>
              </div>
            </div>

            {/* Exam Progress Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Performance</h2>
              {examProgress.length > 0 ? (
                <div className="space-y-4">
                  {examProgress.map((exam) => {
                    const colors = getProgressColor(exam.progress)
                    return (
                      <div key={exam.id} className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{exam.subject} • Last accessed: {exam.lastAccessed}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-semibold ${colors.text}`}>{exam.progress}%</p>
                            <p className="text-xs text-gray-500">{exam.completed}/{exam.total} correct</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${colors.bg}`}
                            style={{ width: `${exam.progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                  <p className="text-gray-600 mb-4">No exam attempts yet</p>
                  <a href="/quizzes" className="text-blue-600 hover:text-blue-700 font-medium">
                    Start your first exam →
                  </a>
                </div>
              )}
            </div>

            {/* Progress by Subject */}
            {progressBySubject.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress by Subject</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {progressBySubject.map((subject) => {
                    const colors = getProgressColor(subject.averageScore)
                    return (
                      <div key={subject.subject} className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">{subject.subject}</h3>
                          <span className={`text-lg font-semibold ${colors.text}`}>{subject.averageScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full transition-all ${colors.bg}`}
                            style={{ width: `${subject.averageScore}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{subject.answeredQuestions} questions attempted</span>
                          <span>{subject.correctAnswers} correct</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Performance Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pass Rate */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Pass Rate</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={userStats?.passRate && userStats.passRate >= 70 ? '#22c55e' : '#ef4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(userStats?.passRate || 0) * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{userStats?.passRate || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {userStats?.completedExams || 0} exams completed
                    </p>
                    <p className={`text-sm ${userStats?.passRate && userStats.passRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {userStats?.passRate && userStats.passRate >= 70 ? 'Above passing threshold' : 'Below passing threshold (70%)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Average Score */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Average Score</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(userStats?.averageScore || 0) * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{userStats?.averageScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Across all {userStats?.completedExams || 0} completed exams
                    </p>
                    <p className="text-sm text-blue-600">
                      {userStats?.averageScore && userStats.averageScore >= 70
                        ? 'Great performance!'
                        : 'Keep practicing to improve'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Learning Insights</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {userStats?.currentStreak && userStats.currentStreak > 0 && (
                  <li>✓ Great job! You're on track with a {userStats.currentStreak}-day learning streak</li>
                )}
                {userStats?.averageScore && userStats.averageScore >= 70 && (
                  <li>✓ Your average score of {userStats.averageScore}% is above the passing threshold</li>
                )}
                {userStats?.passRate !== undefined && userStats.passRate < 70 && (
                  <li>⚠️ Consider reviewing topics where you scored below 70%</li>
                )}
                {(!userStats?.completedExams || userStats.completedExams === 0) && (
                  <li>💡 Start with a practice exam to track your progress</li>
                )}
                {userStats?.completedExams && userStats.completedExams >= 5 && (
                  <li>🎯 You've completed {userStats.completedExams} exams - great dedication!</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
