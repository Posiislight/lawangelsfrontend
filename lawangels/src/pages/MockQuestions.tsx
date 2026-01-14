import { useAuth } from '../contexts/AuthContext'
import { Bell, ArrowRight, Target, CheckCircle, TrendingUp, Clock, Loader2, ClipboardList, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MockTestStart from '../components/MockTestStart'
import MockExamCustomization, { type PracticeMode } from '../components/MockExamCustomization'
import MockExam from '../components/MockExam'
import type { Exam } from '../services/quizApi'
import type { UserStats } from '../services/dashboardApi'

type ViewState = 'list' | 'start' | 'customize' | 'exam'

interface MockExamWithStats extends Exam {
  attemptsTaken: number
  averageScore: number
  bestScore: number
  lastAttempt: string
  color: string
  locked?: boolean
}

interface ExamSettings {
  practiceMode: PracticeMode
  extraTimeEnabled: boolean
}

// API helper for the new optimized endpoint
const fetchMockExamsData = async (): Promise<{ exams: MockExamWithStats[], userStats: UserStats }> => {
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:8000/api'
    return 'https://quiz-backend.onrender.com/api'
  }

  const token = localStorage.getItem('authToken')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${getApiBaseUrl()}/dashboard/mock_exams/`, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()

  // Transform backend response to frontend format
  const exams: MockExamWithStats[] = data.exams.map((exam: any) => ({
    ...exam,
    lastAttempt: exam.lastAttempt ? formatRelativeTimeStatic(exam.lastAttempt) : 'Not attempted',
  }))

  return { exams, userStats: data.userStats }
}

// Static version of formatRelativeTime for use in fetchMockExamsData
const formatRelativeTimeStatic = (dateString: string): string => {
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

export default function MockQuestions() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'FLK1' | 'FLK2'>('FLK1')
  const [mockExams, setMockExams] = useState<MockExamWithStats[]>([]) // Stores only REAL fetched exams
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  // Flow state
  const [currentView, setCurrentView] = useState<ViewState>('list')
  const [selectedExam, setSelectedExam] = useState<MockExamWithStats | null>(null)
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    practiceMode: 'real-exam',
    extraTimeEnabled: false,
  })
  const [resumeProgress, setResumeProgress] = useState<any>(null)

  // OPTIMIZED: Single API call
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const { exams, userStats: stats } = await fetchMockExamsData()
        setMockExams(exams)
        setUserStats(stats)
        console.log('[MockQuestions] Fetched real exams:', exams.length)
      } catch (error) {
        console.error('[MockQuestions] Error fetching mock exams:', error)
        setMockExams([])
        setUserStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper to extract number from "Mock Test X" or "X"
  const getExamNumber = (title: string): number => {
    const match = title.match(/Mock Test (\d+)/i) || title.match(/^(\d+)$/)
    return match ? parseInt(match[1]) : 999
  }

  // Generate displayed list based on active tab
  const getDisplayedExams = () => {
    // 1. Filter real exams for current category
    // Existing exams without category are assumed FLK1
    const relevantRealExams = mockExams.filter(exam => {
      const examCat = exam.category || 'FLK1'
      return examCat === activeTab
    }).map(exam => ({
      ...exam,
      color: activeTab === 'FLK1' ? 'blue' : 'orange'
    }))

    const existingNumbers = new Set(relevantRealExams.map(e => getExamNumber(e.title)))

    // 2. Generate placeholders for missing 1-15
    const placeholders: MockExamWithStats[] = []
    for (let i = 1; i <= 15; i++) {
      if (!existingNumbers.has(i)) {
        placeholders.push({
          id: -((activeTab === 'FLK1' ? 100 : 200) + i),
          title: `Mock Test ${i}`,
          description: 'Coming soon',
          subject: 'mixed',
          category: activeTab,
          duration_minutes: 153,
          total_questions: 90,
          passing_score_percentage: 60,
          is_active: false,
          attemptsTaken: 0,
          averageScore: 0,
          bestScore: 0,
          lastAttempt: 'Not attempted',
          color: activeTab === 'FLK1' ? 'blue' : 'orange',
          locked: true,
          speed_reader_seconds: 70
        } as MockExamWithStats)
      }
    }

    // 3. Merge and sort
    const all = [...relevantRealExams, ...placeholders]
    all.sort((a, b) => getExamNumber(a.title) - getExamNumber(b.title))
    return all
  }

  const displayedExams = getDisplayedExams()

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

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-orange-500' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-400', accent: 'bg-gray-400' },
  }

  // Check if there's saved progress for an exam
  const getSavedProgress = (examId: number) => {
    const saved = localStorage.getItem(`exam_progress_${examId}`)
    if (saved) {
      const data = JSON.parse(saved)
      // Check if saved within last 24 hours
      const savedAt = new Date(data.savedAt)
      const now = new Date()
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
      if (hoursDiff < 24) {
        return data
      } else {
        // Clear expired progress
        localStorage.removeItem(`exam_progress_${examId}`)
      }
    }
    return null
  }


  // Handle exam selection and navigation
  const handleStartExam = (exam: MockExamWithStats) => {
    // Check for saved progress
    const savedProgress = getSavedProgress(exam.id)
    if (savedProgress) {
      // Resume directly to exam with saved progress
      setSelectedExam(exam)
      setResumeProgress(savedProgress)
      setCurrentView('exam')
    } else {
      // Normal flow: start -> customize -> exam
      setSelectedExam(exam)
      setResumeProgress(null)
      setCurrentView('start')
    }
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
        onExit={handleBackToList}
        savedProgress={resumeProgress}
      />
    )
  }

  // Render list view (default)
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h1 className="text-xl md:text-2xl font-normal text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              Mock Questions
            </h1>
            <p className="text-gray-600 text-sm mt-1">Full-length mock exams simulating the real SQE experience</p>
          </div>

          <div className="hidden md:flex flex-1 justify-center">
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

          <div className="hidden md:flex items-center gap-4">
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
      <div className="p-4 md:p-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('FLK1')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${activeTab === 'FLK1' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            FLK 1
            {activeTab === 'FLK1' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('FLK2')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${activeTab === 'FLK2' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            FLK 2
            {activeTab === 'FLK2' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
        </div>

        {isLoading ? (
          <>
            {/* Stats skeleton */}
            <div className="mb-8">
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-6"></div>
            </div>

            {/* Exam cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border-t-4 border-t-gray-300 overflow-hidden bg-white border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="h-3 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded mb-2"></div>
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center justify-between">
                          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-10 w-full bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats cards skeleton */}
            <div className="mb-6">
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div>
                      <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-2"></div>
                      <div className="h-7 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm">Loading mock exams...</span>
            </div>

            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              .animate-shimmer {
                animation: shimmer 2s infinite linear;
              }
            `}</style>
          </>
        ) : (
          <>
            {/* All Mock Exams Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-normal text-black mb-1">All Mock Exams</h2>
              <p className="text-gray-600 text-sm mb-6">Take full-length mock exams to prepare for the {activeTab === 'FLK1' ? 'Functioning Legal Knowledge 1' : 'Functioning Legal Knowledge 2'} assessment</p>

              {displayedExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {displayedExams.map((exam) => {
                    const color = colorMap[exam.color as keyof typeof colorMap] || colorMap.gray
                    const isLocked = exam.locked

                    return (
                      <div
                        key={exam.id}
                        className={`rounded-xl border-t-4 transition-all bg-white border border-gray-200 
                          ${isLocked
                            ? 'border-t-gray-300 opacity-75 cursor-not-allowed'
                            : `${color.accent.replace('bg-', 'border-t-')} hover:shadow-lg cursor-pointer`
                          }`}
                        onClick={() => !isLocked && handleStartExam(exam)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                                {formatSubjectName(exam.subject)}
                              </p>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                {exam.title}
                                {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                              </h3>
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

                            {!isLocked && exam.attemptsTaken > 0 && (
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

                            {!isLocked && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Last Attempt</span>
                                <span className="font-semibold text-gray-900">{exam.lastAttempt}</span>
                              </div>
                            )}

                            {isLocked && (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-sm text-gray-500 italic">Content coming soon</p>
                              </div>
                            )}

                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isLocked) handleStartExam(exam)
                            }}
                            disabled={isLocked}
                            className={`w-full font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-opacity
                                ${isLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : getSavedProgress(exam.id)
                                  ? 'bg-[#E17100] text-white hover:opacity-90'
                                  : `${color.accent} text-white hover:opacity-90`
                              }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="w-4 h-4" />
                                <span>Locked</span>
                              </>
                            ) : getSavedProgress(exam.id) ? (
                              <>
                                Continue Exam
                                <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                {exam.attemptsTaken > 0 ? 'Retake Exam' : 'Start Exam'}
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
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
            <div className="mt-8 md:mt-12">
              <h2 className="text-xl md:text-2xl font-normal text-black mb-4 md:mb-6">Your Mock Exam Stats</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
