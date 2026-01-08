import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Calendar, BookOpen, Scale, CheckCircle, Lightbulb, XCircle, Loader2 } from 'lucide-react'
import { progressApi } from '../services/progressApi'
import type { UserProgressData, WeeklyActivity, PerformanceTrend, CourseProgress, LearningDistribution, RecentActivity } from '../services/progressApi'

export default function ProgressTracker() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<UserProgressData | null>(null)

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await progressApi.getProgress()
      setProgressData(data)
    } catch (err) {
      console.error('Failed to fetch progress data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to render icons
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'book':
        return <BookOpen className="w-6 h-6 text-blue-600" />
      case 'scale':
        return <Scale className="w-6 h-6 text-purple-600" />
      case 'check':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      default:
        return <Lightbulb className="w-6 h-6 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Top Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-9 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded mb-2"></div>
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-[300px] bg-gray-50 rounded-lg flex items-end justify-center gap-4 p-4">
                {[40, 65, 45, 80, 55, 70, 50].map((h, j) => (
                  <div key={j} className="flex-1 max-w-12">
                    <div
                      className="w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg animate-pulse"
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Course Progress & Pie Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="flex items-center justify-center h-[300px]">
              <div className="w-60 h-60 rounded-full border-[40px] border-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Level Card Skeleton */}
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-20 bg-white/30 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-28 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-8 w-16 bg-white/30 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 w-full bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm">Loading your progress...</span>
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load progress</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchProgressData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!progressData) {
    return null
  }

  const { overall_progress, weekly_activity, performance_trend, course_progress, learning_distribution, recent_activity } = progressData

  // Transform weekly activity for chart (use hours)
  const studyHoursData: WeeklyActivity[] = weekly_activity

  // Transform performance trend for chart
  const quizPerformanceData: PerformanceTrend[] = performance_trend

  // Transform learning distribution for chart
  const learningModeData: LearningDistribution[] = learning_distribution

  // Get top 4 courses for display
  const courseProgressList: CourseProgress[] = course_progress.slice(0, 4)

  // Get recent activity
  const recentActivityList: RecentActivity[] = recent_activity.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Overall Progress</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">{overall_progress.overall_percentage}%</p>
          <p className="text-sm text-green-600 mt-2">Overall Completed</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Quizzes Completed</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">{overall_progress.quizzes_completed}</p>
          <p className="text-sm text-gray-600 mt-2">Total Quizzes</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Quiz Accuracy</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">{overall_progress.quiz_accuracy}%</p>
          <p className="text-sm text-gray-600 mt-2">Quiz Performance</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Study Streak</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">{overall_progress.streak_days} days</p>
          <p className="text-sm text-orange-600 mt-2">
            {overall_progress.streak_days > 0 ? 'Keep it up!' : 'Start your streak!'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hours Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-4">Weekly Quiz Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studyHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}
              />
              <Bar dataKey="quizzes" fill="#3B82F6" radius={[8, 8, 0, 0]} name="quizzes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Performance Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-4">Quiz Performance Trend</h3>
          {quizPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quizPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" stroke="#6B7280" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }} />
                <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Complete some quizzes to see your trend!</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Progress and Learning Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-6">Topic Progress</h3>
          {courseProgressList.length > 0 ? (
            <div className="space-y-6">
              {courseProgressList.map((course, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{course.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${course.color}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              <p>Start quizzes to track your progress!</p>
            </div>
          )}
        </div>

        {/* Learning Mode Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-6">Learning Activity Distribution</h3>
          {learningModeData.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={learningModeData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {learningModeData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                {learningModeData.filter(d => d.value > 0).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Complete activities to see distribution!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-normal text-gray-900 mb-6">Recent Activity</h3>
        {recentActivityList.length > 0 ? (
          <div className="space-y-4">
            {recentActivityList.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.icon_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.course}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{activity.status_text}</span>
                  {activity.completed ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[100px] text-gray-500">
            <p>No recent activity. Start a quiz to get started!</p>
          </div>
        )}
      </div>

      {/* Level Progress Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium mb-1">Level {overall_progress.current_level}</h3>
            <p className="text-white/80 text-sm">{overall_progress.rank_display}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{overall_progress.total_points}</p>
            <p className="text-white/80 text-sm">Total Points</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>XP Progress</span>
            <span>{overall_progress.xp} / {overall_progress.xp_to_next_level}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-white"
              style={{ width: `${(overall_progress.xp / overall_progress.xp_to_next_level) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
