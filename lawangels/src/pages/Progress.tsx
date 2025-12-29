import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

interface CourseProgress {
  id: number
  title: string
  progress: number
  completed: number
  total: number
  category: string
  lastAccessed: string
}

export default function Progress() {
  const { user } = useAuth()

  const courseProgress: CourseProgress[] = [
    {
      id: 1,
      title: 'Constitutional and Administrative Law',
      progress: 67,
      completed: 16,
      total: 24,
      category: 'Reading',
      lastAccessed: '2 hours ago',
    },
    {
      id: 2,
      title: 'Contract Law',
      progress: 45,
      completed: 14,
      total: 32,
      category: 'Reading',
      lastAccessed: '1 day ago',
    },
    {
      id: 3,
      title: 'Property Law',
      progress: 80,
      completed: 16,
      total: 20,
      category: 'Videos',
      lastAccessed: '3 hours ago',
    },
    {
      id: 4,
      title: 'Criminal Law',
      progress: 92,
      completed: 22,
      total: 22,
      category: 'Practice',
      lastAccessed: '5 days ago',
    },
  ]

  const overallStats = {
    totalProgress: 71,
    completedCourses: 1,
    activeCourses: 3,
    lockedCourses: 2,
    totalHours: 24,
    averageTimePerDay: '2.5 hours',
    streak: 7,
    lastActive: '2 hours ago',
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return { bg: 'bg-green-500', text: 'text-green-600' }
    if (progress >= 50) return { bg: 'bg-blue-500', text: 'text-blue-600' }
    if (progress >= 25) return { bg: 'bg-yellow-500', text: 'text-yellow-600' }
    return { bg: 'bg-orange-500', text: 'text-orange-600' }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">Progress Tracker</h1>
            <p className="text-sm text-gray-600 mt-1">Track your learning journey and course completion</p>
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
            <p className="text-3xl font-semibold text-gray-900 mb-3">{overallStats.totalProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${overallStats.totalProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Active Courses</p>
            <p className="text-3xl font-semibold text-gray-900 mb-3">{overallStats.activeCourses}</p>
            <p className="text-xs text-gray-500">{overallStats.completedCourses} completed</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Study Streak</p>
            <p className="text-3xl font-semibold text-gray-900 mb-3">{overallStats.streak} days</p>
            <p className="text-xs text-gray-500">Last active: {overallStats.lastActive}</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Total Hours</p>
            <p className="text-3xl font-semibold text-gray-900 mb-3">{overallStats.totalHours}h</p>
            <p className="text-xs text-gray-500">{overallStats.averageTimePerDay}/day avg</p>
          </div>
        </div>

        {/* Course Progress Details */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Progress</h2>
          <div className="space-y-4">
            {courseProgress.map((course) => {
              const colors = getProgressColor(course.progress)
              return (
                <div key={course.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{course.category} • Last accessed: {course.lastAccessed}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-semibold ${colors.text}`}>{course.progress}%</p>
                      <p className="text-xs text-gray-500">{course.completed}/{course.total}</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${colors.bg}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Learning Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Summary */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '80%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">2.5h</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tuesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '60%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">1.8h</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wednesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">3.0h</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Thursday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '70%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">2.1h</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Friday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '50%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">1.5h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Breakdown */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Learning Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Reading</span>
                  <span className="text-sm font-semibold text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Videos</span>
                  <span className="text-sm font-semibold text-gray-900">30%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-purple-500" style={{ width: '30%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Practice</span>
                  <span className="text-sm font-semibold text-gray-900">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '25%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Learning Insights</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Great job! You're on track with a 7-day learning streak</li>
            <li>✓ You spend 30% more time on videos than the average learner</li>
            <li>✓ Your best learning time is early morning (6-9 AM)</li>
            <li>✓ Consider balancing more practice questions with your reading sessions</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
