import { Book, Video, CheckCircle, Lock, Search, Filter } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

interface Course {
  id: number
  title: string
  progress: number
  status: 'active' | 'locked' | 'completed'
  reading: { completed: number; total: number }
  videos: { completed: number; total: number }
  practice: { completed: number; total: number }
  description?: string
  color?: 'blue' | 'purple' | 'green'
}

export default function MyCourses() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'locked' | 'completed'>('all')

  const courses: Course[] = [
    {
      id: 1,
      title: 'Constitutional and Administrative Law',
      progress: 67,
      status: 'active',
      reading: { completed: 16, total: 24 },
      videos: { completed: 12, total: 18 },
      practice: { completed: 80, total: 120 },
      description: 'Learn the foundations of constitutional law and administrative procedures',
      color: 'blue',
    },
    {
      id: 2,
      title: 'Contract Law',
      progress: 45,
      status: 'active',
      reading: { completed: 14, total: 32 },
      videos: { completed: 11, total: 24 },
      practice: { completed: 81, total: 180 },
      description: 'Master the principles of contract formation and enforcement',
      color: 'purple',
    },
    {
      id: 3,
      title: 'Property Law',
      progress: 80,
      status: 'active',
      reading: { completed: 16, total: 20 },
      videos: { completed: 12, total: 15 },
      practice: { completed: 112, total: 140 },
      description: 'Understand property rights, transfers, and land law',
      color: 'green',
    },
    {
      id: 4,
      title: 'Criminal Law',
      progress: 92,
      status: 'completed',
      reading: { completed: 22, total: 22 },
      videos: { completed: 18, total: 18 },
      practice: { completed: 160, total: 160 },
      description: 'Complete study of criminal law principles',
      color: 'blue',
    },
    {
      id: 5,
      title: 'Tort Law',
      progress: 0,
      status: 'locked',
      reading: { completed: 0, total: 28 },
      videos: { completed: 0, total: 20 },
      practice: { completed: 0, total: 150 },
      description: 'Advanced study of tort and civil liability',
      color: 'purple',
    },
    {
      id: 6,
      title: 'Trusts & Wills',
      progress: 0,
      status: 'locked',
      reading: { completed: 0, total: 24 },
      videos: { completed: 0, total: 16 },
      practice: { completed: 0, total: 120 },
      description: 'Estate planning and trust law fundamentals',
      color: 'green',
    },
  ]

  const filteredCourses = courses
    .filter(course => {
      if (filterStatus === 'all') return true
      return course.status === filterStatus
    })
    .filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-12" />
            <img src={logotext} alt="logo" className="w-[80px] h-[18px]" />
          </div>

          <div>
            <h1 className="text-2xl font-normal text-gray-900">My Courses</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-8 pt-6 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'active'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('locked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'locked'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Locked
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'completed'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="p-8">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className={`rounded-lg border transition-shadow hover:shadow-md ${course.status === 'locked'
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{course.title}</h3>
                    {course.status === 'locked' && <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </div>

                  {/* Progress Bar */}
                  {course.status !== 'locked' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(course.progress)}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Learning Content */}
                  <div className="space-y-3 text-sm mb-6">
                    <p className="text-gray-600 font-medium">Learning Content</p>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Book className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span>Reading</span>
                      <span className="ml-auto font-semibold">{course.reading.completed}/{course.reading.total}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Video className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span>Videos</span>
                      <span className="ml-auto font-semibold">{course.videos.completed}/{course.videos.total}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Practice</span>
                      <span className="ml-auto font-semibold">{course.practice.completed}/{course.practice.total}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {course.status !== 'locked' ? (
                    <button className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm py-2 px-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                      Continue Learning →
                    </button>
                  ) : (
                    <button disabled className="w-full text-gray-500 font-medium text-sm py-2 px-4 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed">
                      Locked
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-4">No courses found</p>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Total Courses</p>
            <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Active Courses</p>
            <p className="text-2xl font-semibold text-gray-900">{courses.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Completed</p>
            <p className="text-2xl font-semibold text-gray-900">{courses.filter(c => c.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Average Progress</p>
            <p className="text-2xl font-semibold text-gray-900">
              {Math.round(courses.filter(c => c.status !== 'locked').reduce((acc, c) => acc + c.progress, 0) / courses.filter(c => c.status !== 'locked').length)}%
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
