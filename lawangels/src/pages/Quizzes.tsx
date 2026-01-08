import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Bell, ChevronRight, Loader2, Zap, Trophy, Target, Flame,
  BookOpen, Scale, Building2, FileText, Users, Star, Gamepad2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { topicQuizApi } from '../services/topicQuizApi'
import type { TopicSummary, TopicQuizAttempt, UserGameProfile } from '../services/topicQuizApi'

// Topic icon mapping
const TOPIC_ICONS: Record<string, React.ReactNode> = {
  taxation: <Building2 className="w-6 h-6" />,
  criminal_law: <Scale className="w-6 h-6" />,
  criminal_practice: <Target className="w-6 h-6" />,
  land_law: <Building2 className="w-6 h-6" />,
  solicitors_accounts: <FileText className="w-6 h-6" />,
  professional_ethics: <BookOpen className="w-6 h-6" />,
  trusts: <Users className="w-6 h-6" />,
  wills: <FileText className="w-6 h-6" />,
}

// Topic color mapping
const TOPIC_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string; accent: string }> = {
  taxation: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100', accent: 'bg-amber-500' },
  criminal_law: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-red-100', accent: 'bg-red-500' },
  criminal_practice: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconBg: 'bg-orange-100', accent: 'bg-orange-500' },
  land_law: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100', accent: 'bg-green-500' },
  solicitors_accounts: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100', accent: 'bg-blue-500' },
  professional_ethics: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100', accent: 'bg-purple-500' },
  trusts: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconBg: 'bg-teal-100', accent: 'bg-teal-500' },
  wills: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100', accent: 'bg-indigo-500' },
}

// Helper to fetch optimized quizzes page data
const fetchQuizzesPageData = async (): Promise<{
  topics: TopicSummary[];
  recentAttempts: TopicQuizAttempt[];
  profile: UserGameProfile;
}> => {
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:8000/api'
    return 'https://quiz-backend.onrender.com/api'
  }

  const response = await fetch(`${getApiBaseUrl()}/quizzes-page/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()
  return {
    topics: data.topics,
    recentAttempts: data.recentAttempts,
    profile: data.profile,
  }
}

export default function Quizzes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [recentAttempts, setRecentAttempts] = useState<TopicQuizAttempt[]>([])
  const [profile, setProfile] = useState<UserGameProfile | null>(null)
  const [startingQuiz, setStartingQuiz] = useState<string | null>(null)

  // OPTIMIZED: Single API call instead of 3 separate calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchQuizzesPageData()
        setTopics(data.topics)
        setRecentAttempts(data.recentAttempts.slice(0, 6))
        setProfile(data.profile)
      } catch (error) {
        console.error('Error fetching quizzes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartQuiz = async (topic: string) => {
    try {
      setStartingQuiz(topic)
      const attempt = await topicQuizApi.startQuiz(topic, 5)
      navigate(`/quiz/play/${topic}/${attempt.id}`)
    } catch (err) {
      console.error('Error starting quiz:', err)
      setStartingQuiz(null)
    }
  }

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Completed</span>
      case 'failed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Failed</span>
      case 'in_progress':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">In Progress</span>
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">{status}</span>
    }
  }

  return (
    <DashboardLayout>
      <div className="font-worksans">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-cyan-500" />
                Topic Quizzes
              </h1>
              <p className="text-gray-600">Gamified learning - earn points and level up!</p>
            </div>

            {/* User Stats Badge */}
            {profile && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{profile.current_level}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="text-sm font-medium text-gray-900">{profile.rank_display}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-100 rounded-full px-4 py-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-700">{profile.total_points} pts</span>
                </div>
              </div>
            )}

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
            <>
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz modules skeleton */}
              <div className="mb-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer bg-[length:200%_100%] rounded-xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="w-12 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-4"></div>
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-4"></div>
                    <div className="h-10 w-full bg-gray-300 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                <span className="text-sm">Loading quizzes...</span>
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
              {/* Stats Overview */}
              {profile && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.total_quizzes_completed}</p>
                        <p className="text-xs text-gray-500">Quizzes Completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.total_correct_answers}</p>
                        <p className="text-xs text-gray-500">Correct Answers</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Flame className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{profile.longest_streak}</p>
                        <p className="text-xs text-gray-500">Best Streak</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {profile.total_correct_answers + profile.total_wrong_answers > 0
                            ? Math.round((profile.total_correct_answers / (profile.total_correct_answers + profile.total_wrong_answers)) * 100)
                            : 0}%
                        </p>
                        <p className="text-xs text-gray-500">Accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Attempts Section */}
              {recentAttempts.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Recent Attempts</h2>
                  <p className="text-gray-600 text-sm mb-4">Your latest quiz sessions</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentAttempts.slice(0, 3).map((attempt) => {
                      const colors = TOPIC_COLORS[attempt.topic] || TOPIC_COLORS.taxation
                      const icon = TOPIC_ICONS[attempt.topic] || <BookOpen className="w-6 h-6" />
                      const accuracy = attempt.correct_count + attempt.wrong_count > 0
                        ? Math.round((attempt.correct_count / (attempt.correct_count + attempt.wrong_count)) * 100)
                        : 0

                      return (
                        <div
                          key={attempt.id}
                          onClick={() => attempt.status === 'in_progress'
                            ? navigate(`/quiz/play/${attempt.topic}/${attempt.id}`)
                            : navigate(`/quiz/results/${attempt.id}`)
                          }
                          className={`${colors.bg} ${colors.border} border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`${colors.iconBg} p-2 rounded-lg ${colors.text}`}>
                              {icon}
                            </div>
                            {getStatusBadge(attempt.status)}
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1">{attempt.topic_display}</h3>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>{attempt.correct_count}/{attempt.total_questions} correct</span>
                            <span>•</span>
                            <span>{attempt.points_earned} pts</span>
                          </div>

                          {attempt.status !== 'in_progress' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Accuracy</span>
                                <span className="text-sm font-semibold text-gray-900">{accuracy}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-full rounded-full ${colors.accent}`}
                                  style={{ width: `${accuracy}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{formatRelativeTime(attempt.started_at)}</span>
                            <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quiz Modules by Topic */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Quiz Modules</h2>
                <p className="text-gray-600 text-sm mb-4">Choose a topic to start a gamified quiz</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topics.map((topic) => {
                    const colors = TOPIC_COLORS[topic.topic] || TOPIC_COLORS.taxation
                    const icon = TOPIC_ICONS[topic.topic] || <BookOpen className="w-6 h-6" />
                    const isStarting = startingQuiz === topic.topic

                    return (
                      <div
                        key={topic.topic}
                        className={`${colors.bg} ${colors.border} border rounded-xl p-5 hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`${colors.iconBg} p-3 rounded-xl ${colors.text}`}>
                            {icon}
                          </div>
                          {topic.best_percentage !== null && (
                            <div className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-medium text-gray-700">{topic.best_percentage}%</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1">{topic.topic_display}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {topic.question_count} questions
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-gray-500">
                            {topic.user_attempts > 0 ? `${topic.user_attempts} attempt${topic.user_attempts !== 1 ? 's' : ''}` : 'Not attempted'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleStartQuiz(topic.topic)}
                          disabled={isStarting || topic.question_count === 0}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
                          ${topic.question_count === 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#0F172B] text-white hover:bg-[#1E293B] active:scale-95'
                            }`}
                        >
                          {isStarting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Play Quiz
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
