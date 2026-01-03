import { Video, CheckCircle, Search, Filter, Loader2, BookOpen, FileText, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

// Brand colors
const FLK1_COLOR = '#0AB5FF'
const FLK2_COLOR = '#E35C02'

// API helper functions
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }
  return 'https://quiz-backend.onrender.com/api'
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('authToken')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

interface CourseProgress {
  id: string
  title: string
  category: 'FLK1' | 'FLK2'
  status: 'not_started' | 'in_progress' | 'completed'
  overall_progress: number
  videos: {
    completed: number
    total: number
    progress: number
  }
  quizzes: {
    completed: number
    correct: number
    progress: number
  }
  textbook: {
    available: boolean
    title: string | null
    id: number | null
  }
  mock_exams: {
    completed: number
    progress: number
  }
}

interface MyCoursesResponse {
  courses: CourseProgress[]
  stats: {
    total: number
    in_progress: number
    completed: number
    not_started: number
    average_progress: number
  }
}

export default function MyCourses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'FLK1' | 'FLK2'>('all')
  const [data, setData] = useState<MyCoursesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${getApiBaseUrl()}/my-courses/`, {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const coursesData = await response.json()
        setData(coursesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  // Filter courses based on status, category, and search term
  const filteredCourses = data?.courses
    .filter(course => {
      if (filterStatus !== 'all' && course.status !== filterStatus) return false
      if (filterCategory !== 'all' && course.category !== filterCategory) return false
      return course.title.toLowerCase().includes(searchTerm.toLowerCase())
    }) || []

  const handleCourseClick = (course: CourseProgress) => {
    // Navigate to first available content for this course
    if (course.videos.total > 0) {
      navigate('/video-tutorials')
    } else if (course.quizzes.completed > 0 || course.quizzes.progress === 0) {
      navigate('/quizzes')
    } else {
      navigate('/practice')
    }
  }

  const getAccentColor = (category: string) => {
    return category === 'FLK1' ? FLK1_COLOR : FLK2_COLOR
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const stats = data?.stats || { total: 0, in_progress: 0, completed: 0, not_started: 0, average_progress: 0 }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              My Courses
            </h1>
            <p className="text-gray-600 text-sm mt-1">Track your learning progress across all content</p>
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
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />

          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
            >
              In Progress ({stats.in_progress})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilterStatus('not_started')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'not_started'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Not Started ({stats.not_started})
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Category Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Both
            </button>
            <button
              onClick={() => setFilterCategory('FLK1')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              style={{
                backgroundColor: filterCategory === 'FLK1' ? FLK1_COLOR : `${FLK1_COLOR}15`,
                color: filterCategory === 'FLK1' ? 'white' : FLK1_COLOR
              }}
            >
              <BookOpen className="w-4 h-4" />
              FLK1
            </button>
            <button
              onClick={() => setFilterCategory('FLK2')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              style={{
                backgroundColor: filterCategory === 'FLK2' ? FLK2_COLOR : `${FLK2_COLOR}15`,
                color: filterCategory === 'FLK2' ? 'white' : FLK2_COLOR
              }}
            >
              <BookOpen className="w-4 h-4" />
              FLK2
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="p-8">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCourses.map((course) => {
              const accentColor = getAccentColor(course.category)

              return (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                >
                  {/* Color Bar */}
                  <div className="h-2" style={{ backgroundColor: accentColor }} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor
                          }}
                        >
                          {course.category}
                        </span>
                        <h3 className="font-semibold text-gray-900 mt-2">{course.title}</h3>
                      </div>
                      {course.status === 'completed' && (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Overall Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{course.overall_progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{
                            width: `${course.overall_progress}%`,
                            backgroundColor: course.status === 'completed' ? '#22C55E' : accentColor
                          }}
                        />
                      </div>
                    </div>

                    {/* Content Links - Clickable to navigate */}
                    <div className="space-y-2 text-sm mb-4">
                      {/* Textbook Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (course.textbook.id) {
                            navigate(`/textbook/${course.textbook.id}`)
                          }
                        }}
                        disabled={!course.textbook.available}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${course.textbook.available
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4" style={{ color: course.textbook.available ? accentColor : '#9CA3AF' }} />
                          <span>Textbook</span>
                        </div>
                        <span className={`text-xs font-medium ${course.textbook.available ? 'text-green-600' : 'text-gray-400'}`}>
                          {course.textbook.available ? 'Read →' : 'Coming soon'}
                        </span>
                      </button>

                      {/* Videos Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (course.videos.total > 0) {
                            navigate('/video-tutorials')
                          }
                        }}
                        disabled={course.videos.total === 0}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${course.videos.total > 0
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-2 text-gray-600">
                          <Video className="w-4 h-4" style={{ color: course.videos.total > 0 ? accentColor : '#9CA3AF' }} />
                          <span>Videos</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {course.videos.completed}/{course.videos.total} {course.videos.total > 0 ? '→' : ''}
                        </span>
                      </button>

                      {/* Quiz Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/quizzes')
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2 text-gray-600">
                          <HelpCircle className="w-4 h-4" style={{ color: accentColor }} />
                          <span>Quizzes</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {course.quizzes.completed} done →
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No courses found</p>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Total Courses</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">In Progress</p>
            <p className="text-3xl font-bold" style={{ color: FLK1_COLOR }}>{stats.in_progress}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Not Started</p>
            <p className="text-3xl font-bold text-gray-400">{stats.not_started}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Avg Progress</p>
            <p className="text-3xl font-bold" style={{ color: FLK2_COLOR }}>{stats.average_progress}%</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
