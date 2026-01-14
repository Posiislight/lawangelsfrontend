import { useAuth } from '../contexts/AuthContext'
import { Book, Clock, TrendingUp, Bell, Target, CheckCircle, Calendar, Trophy, Lock, Video, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import ProgressTracker from '../components/ProgressTracker'
import DashboardLayout from '../components/DashboardLayout'
import GlobalSearch from '../components/GlobalSearch'
import { dashboardApi, type UserStats, type RecentActivity } from '../services/dashboardApi'
import type { Exam } from '../services/quizApi'

export default function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])
  const [courses, setCourses] = useState<Array<{
    id: string
    title: string
    category: string
    status: string
    overall_progress: number
    videos: { completed: number; total: number; progress: number }
    quizzes: { completed: number; correct: number; progress: number }
    textbook: { available: boolean; title: string | null; id: number | null }
  }>>([])
  const [continueLearning, setContinueLearning] = useState<{
    reading: { subject: string; title: string; current: number; total: number; progress: number; href: string } | null
    video: { subject: string; title: string; current: number; total: number; progress: number; href: string } | null
    practice: { subject: string; title: string; current: number; total: number; progress: number; href: string } | null
  }>({ reading: null, video: null, practice: null })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        // Fetch dashboard data, courses, and continue learning in parallel
        const [dashboardData, coursesData, continueData] = await Promise.all([
          dashboardApi.getDashboardData(),
          dashboardApi.getMyCourses(),
          dashboardApi.getContinueLearning()
        ])
        setUserStats(dashboardData.userStats)
        setRecentActivity(dashboardData.recentActivity)
        setUpcomingExams(dashboardData.upcomingExams)
        setCourses(coursesData.courses)
        setContinueLearning(continueData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Use fallback data on error
        setUserStats({
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          totalTimeSpentMinutes: 0,
          currentStreak: 0,
          lastActiveDate: null,
          passRate: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const learningModes = [
    {
      title: 'Start Reading',
      description: 'Dive into comprehensive study materials and textbooks',
      icon: '📖',
      bgColor: 'bg-blue-100 border-blue-200',
      href: '/textbook',
    },
    {
      title: 'Watch Videos',
      description: 'Learn from expert-led video tutorials and walkthroughs',
      icon: '🎥',
      bgColor: 'bg-purple-100 border-purple-200',
      href: '/video-tutorials',
    },
    {
      title: 'Practice Questions',
      description: 'Test your knowledge with quizzes and mock examinations',
      icon: '✓',
      bgColor: 'bg-green-100 border-green-200',
      href: '/practice',
    },
  ]

  // Calculate quick stats from real data
  const quickStats = [
    {
      title: "Today's Goal",
      value: userStats ? `${Math.min(userStats.completedExams, 3)}/3` : '0/3',
      unit: 'exams',
      subtitle: userStats && userStats.completedExams < 3 ? `${3 - userStats.completedExams} remaining` : 'Goal reached!',
      icon: Target,
      iconColor: 'text-orange-600',
      progress: userStats ? Math.min((userStats.completedExams / 3) * 100, 100) : 0,
      color: 'orange',
    },
    {
      title: 'Pass Rate',
      value: userStats ? `${userStats.passRate}%` : '0%',
      unit: '',
      subtitle: userStats ? `${userStats.completedExams} exams completed` : 'No exams yet',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      color: 'green',
    },
    {
      title: 'Next Exam',
      value: upcomingExams.length > 0 ? upcomingExams[0].title.substring(0, 15) : 'None',
      unit: '',
      subtitle: upcomingExams.length > 0 ? `${upcomingExams[0].total_questions} questions` : 'No exams available',
      icon: Calendar,
      iconColor: 'text-red-600',
      color: 'red',
    },
  ]

  // Format time helper
  const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Format relative time
  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never'
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h1 className="text-xl md:text-2xl font-normal text-gray-900">
              Welcome {user?.first_name || 'Student'}! 👋
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {userStats?.currentStreak && userStats.currentStreak > 0
                ? `${userStats.currentStreak} day streak! Keep up the momentum!`
                : 'Keep up the momentum!'
              }
            </p>
          </div>

          {/* Search Bar - Hidden on mobile, centered on desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <GlobalSearch placeholder="Search courses, topics..." className="w-80" />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden md:flex w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="px-1 pt-1 pb-1 border-gray-800 flex gap-2 rounded-lg bg-gray-200 w-max ml-4 md:ml-8 mt-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-2 text-sm font-medium transition-colors focus:outline-none border-none ${activeTab === 'overview'
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-gray-900 bg-gray-200 rounded-t-lg'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`pb-2 px-2 text-sm font-medium transition-colors focus:outline-none border-none ${activeTab === 'tracker'
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-gray-900 bg-gray-200 rounded-t-lg'
            }`}
        >
          Progress Tracker
        </button>
      </div>

      {/* Page Content */}
      <div className="p-4 md:p-8">
        {isLoading ? (
          <>
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Learning modes skeleton */}
            <div className="mb-8">
              <div className="h-7 w-60 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl p-8 border bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer bg-[length:200%_100%]">
                    <div className="h-32 mb-4"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-6"></div>
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats skeleton */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg p-6 border border-gray-200 bg-white">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-2"></div>
                        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-2"></div>
                    <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity skeleton */}
            <div className="mb-8">
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mb-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg p-6 border-t-4 border-t-gray-300 border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2"></div>
                    <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm">Loading dashboard...</span>
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
          </>) : activeTab === 'overview' ? (
            <>
              {/* Stats Grid - Now with real data */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <StatCard
                  label="Exams Completed"
                  value={`${userStats?.completedExams || 0}/${userStats?.totalExams || 0}`}
                  icon={<Trophy className="w-6 h-6 text-yellow-600" />}
                  bgColor="bg-yellow-100"
                  feedback={userStats?.totalExams ? `${Math.round((userStats.completedExams / userStats.totalExams) * 100)}% completion` : 'Start your first exam'}
                />
                <StatCard
                  label="Avg Mock Exam Score"
                  value={`${userStats?.averageScore || 0}%`}
                  icon={<Target className="w-6 h-6 text-blue-600" />}
                  bgColor="bg-blue-100"
                  feedback={userStats?.completedExams ? `${userStats.passRate}% pass rate` : 'No scores yet'}
                />
                <StatCard
                  label="Study Time"
                  value={formatTimeSpent(userStats?.totalTimeSpentMinutes || 0)}
                  icon={<Clock className="w-6 h-6 text-purple-600" />}
                  bgColor="bg-purple-100"
                  feedback='Total time'
                />
                <StatCard
                  label="Current Streak"
                  value={`${userStats?.currentStreak || 0} days`}
                  icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
                  bgColor="bg-orange-100"
                  feedback={userStats?.lastActiveDate ? `Last active ${formatRelativeTime(userStats.lastActiveDate)}` : 'Start studying!'}
                />
              </div>

              {/* Main Grid */}
              {/* Choose Your Learning Mode (large cards) */}
              <div className="mb-8">
                <h2 className="text-2xl font-normal text-black mb-1">Choose Your Learning Mode</h2>
                <p className="text-gray-500 mb-6">Select how you'd like to study today</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {learningModes.map((mode, idx) => (
                    <a key={idx} href={mode.href} className={`relative rounded-2xl p-8 border ${mode.bgColor} block hover:shadow-md transition-shadow`}>
                      <div className="absolute left-8 top-1/4 -translate-y-1/2 text-6xl font-extrabold text-gray-400 opacity-60 select-none">{`0${idx + 1}`}</div>
                      <div className="flex flex-col h-full relative z-10">
                        <div className="flex-1">
                          <h3 className="text-xl font-normal text-gray-900 mb-2 pt-20">{mode.title}</h3>
                          <p className="text-sm text-gray-600 mb-6">{mode.description}</p>
                        </div>
                        <div className="mt-auto">
                          <span className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 bg-transparent">
                            <span className="text-2xl">→</span>
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>


              {/* Quick Stats Cards */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {quickStats.map((stat, idx) => {
                    const IconComponent = stat.icon
                    return (
                      <div key={idx} className="rounded-lg p-6 border border-gray-200">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <IconComponent className={`w-6 h-6 ${stat.iconColor} flex-shrink-0 mt-1`} />
                          <div className="flex flex-col items-start flex-1">
                            <div className="text-left">
                              <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-2xl font-normal text-gray-900">{stat.value}</span>
                              <span className="text-2xl font-normal text-gray-900">{stat.unit}</span>
                            </div>
                            <div className="text-left mt-4">
                              <p className="text-xs text-gray-500 mb-2">{stat.subtitle}</p>
                            </div>
                          </div>
                        </div>
                        {stat.progress !== undefined && stat.progress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${stat.color === 'orange' ? 'bg-orange-500' : stat.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${stat.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity Section */}
              {recentActivity.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-normal text-black mb-1">Recent Activity</h2>
                  <p className="text-gray-600 text-sm mb-6">Your latest exam attempts and practice sessions</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {recentActivity.slice(0, 3).map((activity) => {
                      const borderColor = activity.type === 'quiz_passed' ? 'border-t-green-500' :
                        activity.type === 'quiz_failed' ? 'border-t-red-500' : 'border-t-blue-500'
                      const labelColor = activity.type === 'quiz_passed' ? 'text-green-600' :
                        activity.type === 'quiz_failed' ? 'text-red-600' : 'text-blue-600'
                      const label = activity.type === 'quiz_passed' ? 'PASSED' :
                        activity.type === 'quiz_failed' ? 'FAILED' : 'IN PROGRESS'

                      return (
                        <div key={activity.id} className={`rounded-lg p-6 border-t-4 ${borderColor} border border-gray-200 bg-white`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-xs font-semibold ${labelColor} uppercase tracking-wide`}>{label}</span>
                            <span className="text-xs text-gray-500">{formatRelativeTime(activity.date)}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h4>
                          {activity.score !== undefined && (
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-gray-600">Score</span>
                              <span className="text-sm font-semibold text-gray-900">{activity.score}%</span>
                            </div>
                          )}
                          {activity.score !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                              <div
                                className={`h-2 rounded-full ${activity.passed ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${activity.score}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pick Up Where You Left Off - Dynamic data from backend */}
              {(continueLearning.reading || continueLearning.video || continueLearning.practice) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-normal text-black mb-1">Pick Up Where You Left Off</h2>
                  <p className="text-gray-600 text-sm mb-6">Continue your learning journey across reading, videos, and practice</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Reading Card */}
                    {continueLearning.reading && (
                      <div className="rounded-lg p-6 border-t-4 border-t-blue-500 border border-blue-600 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">READING</span>
                          <span className="text-xs text-gray-500">Chapter {continueLearning.reading.current} of {continueLearning.reading.total}</span>
                        </div>
                        <h3 className="text-sm text-gray-600 mb-1">{continueLearning.reading.subject}</h3>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{continueLearning.reading.title}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">{continueLearning.reading.total - continueLearning.reading.current} chapters left</span>
                          <span className="text-sm font-semibold text-gray-900">{continueLearning.reading.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${continueLearning.reading.progress}%` }} />
                        </div>
                        <a href={continueLearning.reading.href} className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1">
                          Continue learning <span>→</span>
                        </a>
                      </div>
                    )}

                    {/* Watching Card */}
                    {continueLearning.video && (
                      <div className="rounded-lg p-6 border-t-4 border-t-purple-500 border border-purple-500 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">WATCHING</span>
                          <span className="text-xs text-gray-500">Video {continueLearning.video.current} of {continueLearning.video.total}</span>
                        </div>
                        <h3 className="text-sm text-gray-600 mb-1">{continueLearning.video.subject}</h3>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{continueLearning.video.title}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">{continueLearning.video.total - continueLearning.video.current} videos left</span>
                          <span className="text-sm font-semibold text-gray-900">{continueLearning.video.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div className="h-2 rounded-full bg-purple-500" style={{ width: `${continueLearning.video.progress}%` }} />
                        </div>
                        <a href={continueLearning.video.href} className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1">
                          Continue learning <span>→</span>
                        </a>
                      </div>
                    )}

                    {/* Practicing Card */}
                    {continueLearning.practice && (
                      <div className="rounded-lg p-6 border-t-4 border-t-green-500 border border-green-500 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">PRACTICING</span>
                          <span className="text-xs text-gray-500">Question {continueLearning.practice.current} of {continueLearning.practice.total}</span>
                        </div>
                        <h3 className="text-sm text-gray-600 mb-1">{continueLearning.practice.subject}</h3>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{continueLearning.practice.title}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">{continueLearning.practice.total - continueLearning.practice.current} questions left</span>
                          <span className="text-sm font-semibold text-gray-900">{continueLearning.practice.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${continueLearning.practice.progress}%` }} />
                        </div>
                        <a href={continueLearning.practice.href} className="text-green-600 hover:text-green-700 font-medium text-sm inline-flex items-center gap-1">
                          Continue learning <span>→</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Available Exams - From Backend */}
              {upcomingExams.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6 rounded-lg">
                    <div>
                      <h2 className="text-2xl font-normal text-black">Available Exams</h2>
                      <p className="text-gray-600 text-sm">Practice with real SQE-style exams</p>
                    </div>
                    <a href="/quizzes" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View all →
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {upcomingExams.map((exam) => (
                      <div key={exam.id} className="rounded-3xl p-4 border border-gray-200 bg-white relative hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-normal text-gray-900">{exam.title}</h3>
                        </div>
                        <span className="absolute top-0 right-0 bg-[#0AB5FF] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                          {exam.subject.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="space-y-3 text-sm mt-4">
                          <div className="flex items-center gap-3 text-gray-600">
                            <Book className="w-5 h-5 text-blue-600" />
                            <span>Questions</span>
                            <span className="ml-auto font-semibold">{exam.total_questions}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <span>Duration</span>
                            <span className="ml-auto font-semibold">{exam.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Pass Score</span>
                            <span className="ml-auto font-semibold">{exam.passing_score_percentage}%</span>
                          </div>
                        </div>
                        <a
                          href="/mock-questions"
                          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-center block hover:bg-blue-600 transition-colors"
                        >
                          Start Exam
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Courses - Now connected to backend */}
              {courses.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6 rounded-lg">
                    <div>
                      <h2 className="text-2xl font-normal text-black">Your Courses</h2>
                      <p className="text-gray-600 text-sm">Each course includes reading materials, video tutorials, and practice questions</p>
                    </div>
                    <a href="/my-courses" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View all →
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.id} className={`rounded-3xl p-4 border border-gray-200 ${course.status === 'not_started' ? 'bg-gray-50' : 'bg-white'} relative`}>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-normal text-gray-900">{course.title}</h3>
                          {course.status === 'not_started' && <Lock className="w-5 h-5 text-gray-400" />}
                        </div>
                        {course.status === 'in_progress' && (
                          <span className="absolute top-0 right-0 bg-[#0AB5FF] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">Active</span>
                        )}
                        {course.status === 'completed' && (
                          <span className="absolute top-0 right-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">Complete</span>
                        )}

                        {course.status !== 'not_started' ? (
                          <>
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Overall Progress</span>
                                <span className="text-sm font-semibold text-gray-900">{course.overall_progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${course.overall_progress}%` }} />
                              </div>
                            </div>
                            <div className="space-y-3 text-sm">
                              <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                              {course.textbook?.available && (
                                <div className="flex items-center gap-3 text-gray-600">
                                  <Book className="w-5 h-5 text-blue-600" />
                                  <span>Reading</span>
                                  <span className="ml-auto font-semibold">Available</span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-gray-600">
                                <Video className="w-5 h-5 text-purple-600" />
                                <span>Videos</span>
                                <span className="ml-auto font-semibold">View →</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-600">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Practice</span>
                                <span className="ml-auto font-semibold">View →</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Start learning to track progress</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
          <ProgressTracker />
        )}
      </div>
    </DashboardLayout>
  )
}

function StatCard({
  label,
  value,
  icon,
  bgColor,
  feedback
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  bgColor: string
  feedback: string

}) {
  const feedbackColor = feedback.toString().startsWith('+') ? 'text-green-600' : feedback.toString().startsWith('-') ? 'text-red-600' : 'text-gray-600'
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-3xl font-normal text-gray-900 mb-2">{value}</p>
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className={`text-sm ${feedbackColor} mb-2`}>{feedback}</p>
    </div>
  )
}
