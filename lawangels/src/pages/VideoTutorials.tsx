import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowRight, PlayCircle, Bookmark, Clock, Brain, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { videoApi, type VideoCourse, type OverallVideoStats } from '../services/videoApi'

// Color mapping for courses
const courseColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' },
  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', accent: 'bg-cyan-500' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', accent: 'bg-pink-500' },
]

export default function VideoTutorials() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<VideoCourse[]>([])
  const [stats, setStats] = useState<OverallVideoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [coursesData, statsData] = await Promise.all([
          videoApi.getCourses(),
          videoApi.getOverallStats()
        ])
        setCourses(coursesData)
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video tutorials')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCourseClick = async (course: VideoCourse) => {
    try {
      // Get course detail to find first video
      const courseDetail = await videoApi.getCourse(course.slug)
      if (courseDetail.videos.length > 0) {
        // Navigate to first unwatched video, or first video if all watched
        const unwatchedVideo = courseDetail.videos.find(v => !v.is_completed)
        const targetVideo = unwatchedVideo || courseDetail.videos[0]
        navigate(`/video-tutorials/watch/${targetVideo.id}`)
      }
    } catch (err) {
      console.error('Failed to navigate to course:', err)
    }
  }

  const handleContinueWatching = (videoId: number) => {
    navigate(`/video-tutorials/watch/${videoId}`)
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              🎥 Video Tutorials
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
              {stats.continue_watching.map((item, idx) => {
                const color = courseColors[idx % courseColors.length]

                return (
                  <div
                    key={item.video_id}
                    onClick={() => handleContinueWatching(item.video_id)}
                    className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className={`relative h-40 ${color.bg} flex items-center justify-center`}>
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
                )
              })}
            </div>
          </div>
        )}

        {/* FLK1 - Functioning Legal Knowledge 1 */}
        {courses.filter(c => c.category === 'FLK1').length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📘</span>
              <h2 className="text-2xl font-semibold text-gray-900">FLK1 — Functioning Legal Knowledge 1</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Foundation legal knowledge: Business Law, Contract Law, Torts, and more</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.filter(c => c.category === 'FLK1').map((course, idx) => {
                const color = courseColors[idx % courseColors.length]

                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="rounded-xl overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className={`h-3 ${color.accent}`} />
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
                            className={`h-2 rounded-full ${color.accent}`}
                            style={{ width: `${course.progress_percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium text-gray-900">{course.total_duration_formatted}</span>
                        </div>
                      </div>

                      <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                        {course.videos_completed > 0 ? 'Continue' : 'Start'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FLK2 - Functioning Legal Knowledge 2 */}
        {courses.filter(c => c.category === 'FLK2').length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📗</span>
              <h2 className="text-2xl font-semibold text-gray-900">FLK2 — Functioning Legal Knowledge 2</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Advanced legal practice: Property, Wills, Solicitors' Accounts, & more</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.filter(c => c.category === 'FLK2').map((course, idx) => {
                const color = courseColors[(idx + 4) % courseColors.length]

                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="rounded-xl overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className={`h-3 ${color.accent}`} />
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
                            className={`h-2 rounded-full ${color.accent}`}
                            style={{ width: `${course.progress_percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium text-gray-900">{course.total_duration_formatted}</span>
                        </div>
                      </div>

                      <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                        {course.videos_completed > 0 ? 'Continue' : 'Start'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
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
                    <Bookmark className="w-6 h-6 text-green-600" />
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
                    <Brain className="w-6 h-6 text-orange-600" />
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
    </DashboardLayout>
  )
}
