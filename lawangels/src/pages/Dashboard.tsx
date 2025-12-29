import { useAuth } from '../contexts/AuthContext'
import { Book, Clock, TrendingUp, Bell, Target, CheckCircle, Calendar, Trophy, Lock, Video, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import ProgressTracker from '../components/ProgressTracker'
import DashboardLayout from '../components/DashboardLayout'
import { dashboardApi, type UserStats, type RecentActivity } from '../services/dashboardApi'
import { quizApi, type Exam } from '../services/quizApi'

export default function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const [stats, activity, exams] = await Promise.all([
          dashboardApi.getUserStats(),
          dashboardApi.getRecentActivity(5),
          quizApi.getExams(),
        ])
        setUserStats(stats)
        setRecentActivity(activity)
        setUpcomingExams(exams.filter(e => e.is_active).slice(0, 3))
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
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              Welcome {user?.first_name || 'Student'}! 👋
            </h1>
            <p className="text-gray-600">
              {userStats?.currentStreak && userStats.currentStreak > 0
                ? `${userStats.currentStreak} day streak! Keep up the momentum!`
                : 'Keep up the momentum!'
              }
            </p>
          </div>

          {/* Search Bar - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search courses, topics..."
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

      {/* Tab Switch */}
      <div className="px-1 pt-1 pb-1 border-gray-800 flex gap-2 rounded-lg bg-gray-200  w-max ml-8 mt-4">
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
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* Stats Grid - Now with real data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Exams Completed"
                value={`${userStats?.completedExams || 0}/${userStats?.totalExams || 0}`}
                icon={<Trophy className="w-6 h-6 text-yellow-600" />}
                bgColor="bg-yellow-100"
                feedback={userStats?.totalExams ? `${Math.round((userStats.completedExams / userStats.totalExams) * 100)}% completion` : 'Start your first exam'}
              />
              <StatCard
                label="Average Score"
                value={`${userStats?.averageScore || 0}%`}
                icon={<Target className="w-6 h-6 text-blue-600" />}
                bgColor="bg-blue-100"
                feedback={userStats?.passRate ? `${userStats.passRate}% pass rate` : 'No scores yet'}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Pick Up Where You Left Off */}
            <div className="mb-8">
              <h2 className="text-2xl font-normal text-black mb-1">Pick Up Where You Left Off</h2>
              <p className="text-gray-600 text-sm mb-6">Continue your learning journey across reading, videos, and practice</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Reading Card */}
                <div className="rounded-lg p-6 border-t-4 border-t-blue-500 border border-blue-600 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">READING</span>
                    <span className="text-xs text-gray-500">Chapter 4 of 24</span>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Constitutional Law</h3>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Parliamentary Sovereignty</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">12 hrs left</span>
                    <span className="text-sm font-semibold text-gray-900">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '67%' }} />
                  </div>
                  <a href="/textbook" className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1">
                    Continue learning <span>→</span>
                  </a>
                </div>

                {/* Watching Card */}
                <div className="rounded-lg p-6 border-t-4 border-t-purple-500 border border-purple-500 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">WATCHING</span>
                    <span className="text-xs text-gray-500">Video 3 of 8</span>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Contract Law</h3>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Consideration in Contracts</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">15.20 remaining</span>
                    <span className="text-sm font-semibold text-gray-900">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: '45%' }} />
                  </div>
                  <a href="/video-tutorials" className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1">
                    Continue learning <span>→</span>
                  </a>
                </div>

                {/* Practicing Card */}
                <div className="rounded-lg p-6 border-t-4 border-t-green-500 border border-green-500 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">PRACTICING</span>
                    <span className="text-xs text-gray-500">Question 16 of 20</span>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Property Law</h3>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Land Registration</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">4 questions left</span>
                    <span className="text-sm font-semibold text-gray-900">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: '80%' }} />
                  </div>
                  <a href="/practice" className="text-green-600 hover:text-green-700 font-medium text-sm inline-flex items-center gap-1">
                    Continue learning <span>→</span>
                  </a>
                </div>
              </div>
            </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        href={`/quiz/${exam.id}`}
                        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-center block hover:bg-blue-600 transition-colors"
                      >
                        Start Exam
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Courses - Static for now (no backend support) */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Constitutional and Administrative Law */}
                <div className="rounded-3xl p-4 border border-gray-200 bg-white relative">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-normal text-gray-900">Constitutional and<br />Administrative Law</h3>
                  </div>
                  <span className="absolute top-0 right-0 bg-[#0AB5FF] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">Active</span>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm font-semibold text-gray-900">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: '67%' }} />
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Book className="w-5 h-5 text-blue-600" />
                      <span>Reading</span>
                      <span className="ml-auto font-semibold">16/24</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Video className="w-5 h-5 text-purple-600" />
                      <span>Videos</span>
                      <span className="ml-auto font-semibold">12/18</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Practice</span>
                      <span className="ml-auto font-semibold">80/120</span>
                    </div>
                  </div>
                </div>

                {/* Contract Law */}
                <div className="rounded-lg p-6 border border-gray-200 bg-white">
                  <h3 className="font-normal text-gray-900 mb-4">Contract Law</h3>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm font-semibold text-gray-900">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Book className="w-5 h-5 text-blue-600" />
                      <span>Reading</span>
                      <span className="ml-auto font-semibold">14/32</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Video className="w-5 h-5 text-purple-600" />
                      <span>Videos</span>
                      <span className="ml-auto font-semibold">11/24</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Practice</span>
                      <span className="ml-auto font-semibold">81/180</span>
                    </div>
                  </div>
                </div>

                {/* Tort Law - Locked */}
                <div className="rounded-3xl p-4 border border-gray-200 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-normal text-gray-900">Tort Law</h3>
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Complete previous courses to unlock</p>
                </div>
              </div>
            </div>
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
