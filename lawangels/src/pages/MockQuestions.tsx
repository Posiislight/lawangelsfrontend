import { useAuth } from '../contexts/AuthContext'
import { Bell, ArrowRight, Target, CheckCircle, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MockTestStart from '../components/MockTestStart'
import MockExamCustomization, { type PracticeMode } from '../components/MockExamCustomization'
import MockExam from '../components/MockExam'
import { quizApi, type Exam, type ExamAttempt } from '../services/quizApi'
import { dashboardApi, type UserStats } from '../services/dashboardApi'

type ViewState = 'list' | 'start' | 'customize' | 'exam'

interface MockExamWithStats extends Exam {
  attemptsTaken: number
  averageScore: number
  bestScore: number
  lastAttempt: string
  color: string
}

interface ExamSettings {
  practiceMode: PracticeMode
  extraTimeEnabled: boolean
}

export default function MockQuestions() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [mockExams, setMockExams] = useState<MockExamWithStats[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  // Flow state
  const [currentView, setCurrentView] = useState<ViewState>('list')
  const [selectedExam, setSelectedExam] = useState<MockExamWithStats | null>(null)
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    practiceMode: 'real-exam',
    extraTimeEnabled: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch exams first - this should always work
        let exams: Exam[] = []
        try {
          exams = await quizApi.getExams()
          console.log('[MockQuestions] Fetched exams:', exams.length)
        } catch (examError) {
          console.error('[MockQuestions] Error fetching exams:', examError)
          // If exams fail, we can't continue
          setIsLoading(false)
          return
        }

        // Fetch attempts and stats - these may fail if not authenticated
        let attempts: ExamAttempt[] = []
        let stats: UserStats | null = null

        try {
          attempts = await quizApi.getAttempts()
          console.log('[MockQuestions] Fetched attempts:', attempts.length)
        } catch (attemptError) {
          console.warn('[MockQuestions] Could not fetch attempts (user may not be logged in):', attemptError)
          // Continue without attempts
        }

        try {
          stats = await dashboardApi.getUserStats()
          console.log('[MockQuestions] Fetched user stats')
        } catch (statsError) {
          console.warn('[MockQuestions] Could not fetch user stats:', statsError)
          // Continue without stats
        }

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
        const enrichedExams: MockExamWithStats[] = exams.map((exam, idx) => {
          const examAttempts = attemptsByExam.get(exam.id) || []
          const completedAttempts = examAttempts.filter(a => a.status === 'completed')
          const scores = completedAttempts
            .map(a => a.score)
            .filter((s): s is number => s !== null)

          // Get latest attempt
          const sortedAttempts = [...completedAttempts].sort(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
          )
          const lastAttemptDate = sortedAttempts.length > 0
            ? formatRelativeTime(sortedAttempts[0].started_at)
            : 'Not attempted'

          return {
            ...exam,
            attemptsTaken: completedAttempts.length,
            averageScore: scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0,
            bestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lastAttempt: lastAttemptDate,
            color: colors[idx % colors.length],
          }
        })

        setMockExams(enrichedExams)
        console.log('[MockQuestions] Set enrichedExams:', enrichedExams.length)
      } catch (error) {
        console.error('Error fetching mock exams:', error)
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
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`
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

  // Handle exam selection and navigation
  const handleStartExam = (exam: MockExamWithStats) => {
    setSelectedExam(exam)
    setCurrentView('start')
  }

  const handleContinueToCustomize = () => {
    setCurrentView('customize')
  }

  const handleContinueToExam = (settings: ExamSettings) => {
    setExamSettings(settings)
    setCurrentView('exam')
  }

  const handleBackToList = () => {
    setSelectedExam(null)
    setCurrentView('list')
  }

  const handleBackToStart = () => {
    setCurrentView('start')
  }

  // Render MockTestStart view
  if (currentView === 'start' && selectedExam) {
    return (
      <MockTestStart
        exam={selectedExam}
        onContinue={handleContinueToCustomize}
        onBack={handleBackToList}
      />
    )
  }

  // Render MockExamCustomization view
  if (currentView === 'customize' && selectedExam) {
    return (
      <MockExamCustomization
        exam={selectedExam}
        onContinue={handleContinueToExam}
        onBack={handleBackToStart}
      />
    )
  }

  // Render MockExam view
  if (currentView === 'exam' && selectedExam) {
    return (
      <MockExam
        examId={selectedExam.id}
        practiceMode={examSettings.practiceMode}
        extraTimeEnabled={examSettings.extraTimeEnabled}
      />
    )
  }

  // Render list view (default)
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              📋 Mock Questions
            </h1>
            <p className="text-gray-600">Full-length mock exams simulating the real SQE experience</p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search mock exams..."
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
            <span className="ml-2 text-gray-600">Loading mock exams...</span>
          </div>
        ) : (
          <>
            {/* All Mock Exams Section */}
            <div>
              <h2 className="text-2xl font-normal text-black mb-1">All Mock Exams</h2>
              <p className="text-gray-600 text-sm mb-6">Take full-length mock exams to prepare for the SQE assessment</p>

              {mockExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockExams.map((exam) => {
                    const color = colorMap[exam.color as keyof typeof colorMap]

                    return (
                      <div
                        key={exam.id}
                        className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                        onClick={() => handleStartExam(exam)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                                {formatSubjectName(exam.subject)}
                              </p>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.title}</h3>
                            </div>
                          </div>

                          <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Questions</span>
                              <span className="font-semibold text-gray-900">{exam.total_questions}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Duration</span>
                              <span className="font-semibold text-gray-900">{exam.duration_minutes} mins</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Pass Score</span>
                              <span className="font-semibold text-gray-900">{exam.passing_score_percentage}%</span>
                            </div>

                            {exam.attemptsTaken > 0 && (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${color.accent}`}
                                    style={{ width: `${exam.bestScore}%` }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 mb-1">Best Score</p>
                                    <p className="text-lg font-semibold text-gray-900">{exam.bestScore}%</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 mb-1">Avg Score</p>
                                    <p className="text-lg font-semibold text-gray-900">{exam.averageScore}%</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Attempts</span>
                                  <span className="font-semibold text-gray-900">{exam.attemptsTaken}</span>
                                </div>
                              </>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Last Attempt</span>
                              <span className="font-semibold text-gray-900">{exam.lastAttempt}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartExam(exam)
                            }}
                            className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                          >
                            {exam.attemptsTaken > 0 ? 'Retake Exam' : 'Start Exam'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                  <p className="text-gray-600 mb-4">No mock exams available yet</p>
                  <p className="text-sm text-gray-500">Check back later for new exams</p>
                </div>
              )}
            </div>

            {/* Exam Preparation Stats */}
            <div className="mt-12">
              <h2 className="text-2xl font-normal text-black mb-6">Your Mock Exam Stats</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Exams Completed</p>
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.completedExams || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Total attempts</p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pass Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.passRate || 0}%</p>
                    </div>
                  </div>
                  <p className={`text-xs ${userStats?.passRate && userStats.passRate >= 70 ? 'text-green-600' : 'text-gray-600'} font-medium`}>
                    {userStats?.passRate && userStats.passRate >= 70 ? 'Above threshold!' : 'Keep practicing'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className="text-2xl font-semibold text-gray-900">{userStats?.averageScore || 0}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Across all exams</p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hours Studied</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {userStats?.totalTimeSpentMinutes
                          ? `${Math.round(userStats.totalTimeSpentMinutes / 60)}h`
                          : '0h'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Mock exam time</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
