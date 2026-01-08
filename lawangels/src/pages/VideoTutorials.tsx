import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowRight, PlayCircle, Clock, Loader2, BookOpen, Library, Video } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { videoApi, type VideoCourse, type OverallVideoStats } from '../services/videoApi'

// Brand colors for categories
const FLK1_COLOR = '#0AB5FF' // Blue for FLK1
const FLK2_COLOR = '#E35C02' // Orange for FLK2
const ALL_COLOR = '#0F172B'  // Dark for All

export default function VideoTutorials() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<VideoCourse[]>([])
  const [stats, setStats] = useState<OverallVideoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'FLK1' | 'FLK2'>('all')

  // Filter courses based on selected category
  const filteredCourses = categoryFilter === 'all'
    ? courses
    : courses.filter(c => c.category === categoryFilter)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // OPTIMIZED: Single API call for all data (much faster!)
        const pageData = await videoApi.getPageData()
        setCourses(pageData.courses)
        setStats(pageData.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video tutorials')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])


  const handleCourseClick = (course: VideoCourse) => {
    // Navigate directly using pre-computed next_video_id (no extra API call!)
    const videoId = course.next_video_id || course.first_video_id
    if (videoId) {
      navigate(`/video-tutorials/watch/${videoId}`)
    }
  }

  const handleContinueWatching = (videoId: number) => {
    navigate(`/video-tutorials/watch/${videoId}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Course cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-40 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]"></div>
                <div className="p-4">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Loading video tutorials...</span>
          </div>
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-600" />
              Video Tutorials
            </h1>
            <p className="text-gray-600">Learn from expert instructors with comprehensive video lectures</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search videos, topics..."
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
        {/* Continue Watching Section */}
        {stats && stats.continue_watching.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-black mb-1">Continue Watching</h2>
            <p className="text-gray-600 text-sm mb-6">Pick up where you left off</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.continue_watching.map((item) => (
                <div
                  key={item.video_id}
                  onClick={() => handleContinueWatching(item.video_id)}
                  className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-gray-400" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.video_title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{item.course_title}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration_formatted}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2`}
            style={{
              backgroundColor: categoryFilter === 'all' ? ALL_COLOR : '#F3F4F6',
              color: categoryFilter === 'all' ? 'white' : '#4B5563'
            }}
          >
            <Library className="w-4 h-4" />
            All Courses
          </button>
          <button
            onClick={() => setCategoryFilter('FLK1')}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            style={{
              backgroundColor: categoryFilter === 'FLK1' ? FLK1_COLOR : `${FLK1_COLOR}15`,
              color: categoryFilter === 'FLK1' ? 'white' : FLK1_COLOR
            }}
          >
            <BookOpen className="w-4 h-4" />
            FLK1
          </button>
          <button
            onClick={() => setCategoryFilter('FLK2')}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            style={{
              backgroundColor: categoryFilter === 'FLK2' ? FLK2_COLOR : `${FLK2_COLOR}15`,
              color: categoryFilter === 'FLK2' ? 'white' : FLK2_COLOR
            }}
          >
            <BookOpen className="w-4 h-4" />
            FLK2
          </button>
        </div>

        {/* FLK1 - Functioning Legal Knowledge 1 */}
        {(categoryFilter === 'all' || categoryFilter === 'FLK1') && filteredCourses.filter(c => c.category === 'FLK1').length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-7 h-7" style={{ color: FLK1_COLOR }} />
              <h2 className="text-2xl font-semibold text-gray-900">FLK1 — Functioning Legal Knowledge 1</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Foundation legal knowledge: Business Law, Contract Law, Torts, and more</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.filter(c => c.category === 'FLK1').map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="rounded-xl overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="h-3" style={{ backgroundColor: FLK1_COLOR }} />
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{course.title}</h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Videos</span>
                        <span className="font-medium text-gray-900">
                          {course.videos_completed}/{course.total_videos}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${course.progress_percentage}%`, backgroundColor: FLK1_COLOR }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium text-gray-900">{course.total_duration_formatted}</span>
                      </div>
                    </div>

                    <button
                      className="w-full text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: FLK1_COLOR }}
                    >
                      {course.videos_completed > 0 ? 'Continue' : 'Start'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLK2 - Functioning Legal Knowledge 2 */}
        {(categoryFilter === 'all' || categoryFilter === 'FLK2') && filteredCourses.filter(c => c.category === 'FLK2').length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-7 h-7" style={{ color: FLK2_COLOR }} />
              <h2 className="text-2xl font-semibold text-gray-900">FLK2 — Functioning Legal Knowledge 2</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Advanced legal practice: Property, Wills, Solicitors' Accounts, & more</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.filter(c => c.category === 'FLK2').map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="rounded-xl overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="h-3" style={{ backgroundColor: FLK2_COLOR }} />
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{course.title}</h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Videos</span>
                        <span className="font-medium text-gray-900">
                          {course.videos_completed}/{course.total_videos}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${course.progress_percentage}%`, backgroundColor: FLK2_COLOR }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium text-gray-900">{course.total_duration_formatted}</span>
                      </div>
                    </div>

                    <button
                      className="w-full text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: FLK2_COLOR }}
                    >
                      {course.videos_completed > 0 ? 'Continue' : 'Start'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Courses Yet</h3>
            <p className="text-gray-500">Video courses will appear here once they are added.</p>
          </div>
        )}

        {/* Learning Stats */}
        {stats && (
          <div className="mt-12">
            <h2 className="text-2xl font-normal text-black mb-6">Your Video Stats</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Videos Watched</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completed_videos}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">of {stats.total_videos} total</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Watched</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_watched_formatted}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Total watch time</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Courses Started</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.courses_started}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">of {stats.total_courses} total</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Courses Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.courses_completed}</p>
                  </div>
                </div>
                <p className="text-xs text-green-600 font-medium">Keep watching!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout >
  )
}
