import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Calendar, BookOpen, Scale, CheckCircle, Lightbulb, XCircle } from 'lucide-react'

export default function ProgressTracker() {
  // Chart data
  const studyHoursData = [
    { day: 'Mon', hours: 2 },
    { day: 'Tue', hours: 3 },
    { day: 'Wed', hours: 2.5 },
    { day: 'Thu', hours: 4 },
    { day: 'Fri', hours: 3.5 },
    { day: 'Sat', hours: 5 },
    { day: 'Sun', hours: 3 },
  ]

  const quizPerformanceData = [
    { week: '1', score: 75 },
    { week: '2', score: 78 },
    { week: '3', score: 82 },
    { week: '4', score: 85 },
    { week: '5', score: 88 },
    { week: '6', score: 90 },
  ]

  const learningModeData = [
    { name: 'Reading (23%)', value: 23, color: '#3B82F6' },
    { name: 'Video (31%)', value: 31, color: '#8B5CF6' },
    { name: 'Journal (20%)', value: 20, color: '#10B981' },
    { name: 'Test prep (26%)', value: 26, color: '#F59E0B' },
  ]

  const courseProgressList = [
    { name: 'Constitutional and Administrative Law', progress: 67, color: 'bg-blue-500' },
    { name: 'Constitutional and Administrative Law', progress: 87, color: 'bg-green-500' },
    { name: 'Property Law', progress: 61, color: 'bg-blue-500' },
    { name: 'Criminal Law', progress: 13, color: 'bg-gray-500' },
  ]

  const recentActivity = [
    { type: 'Reading', course: 'Property Law', status: '7 hours ago', completed: true, iconType: 'book' },
    { type: 'Contract Law', course: 'Contract Law', status: '7 hours ago', completed: false, iconType: 'scale' },
    { type: 'Constitutional Law', course: 'Constitutional Law', status: 'Yesterday', completed: true, iconType: 'book' },
    { type: 'Criminal Law', course: 'Criminal Law', status: 'Yesterday', completed: true, iconType: 'check' },
    { type: 'LJ 1.1 - Mock 1', course: 'Multiple Topic', status: 'Yesterday', completed: true, iconType: 'check' },
  ]

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

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Overall Progress</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">68%</p>
          <p className="text-sm text-green-600 mt-2">Overall Completed</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Study Time</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">42 hrs</p>
          <p className="text-sm text-gray-600 mt-2">Total Study Hours</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Quiz Accuracy</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">80%</p>
          <p className="text-sm text-gray-600 mt-2">Quiz Performance</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Study Streak</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-normal text-gray-900">12 days</p>
          <p className="text-sm text-orange-600 mt-2">Keep it up!</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hours Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studyHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }} />
              <Bar dataKey="hours" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Performance Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-4">Quiz Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quizPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }} />
              <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Progress and Learning Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-6">Course Progress</h3>
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
        </div>

        {/* Learning Mode Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-normal text-gray-900 mb-6">Learning Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={learningModeData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {learningModeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            {learningModeData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-normal text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.iconType)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                <p className="text-xs text-gray-500">{activity.course}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{activity.status}</span>
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
      </div>
    </div>
  )
}
