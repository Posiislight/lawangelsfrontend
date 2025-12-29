import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Bell, ArrowRight, PlayCircle, Bookmark, Clock, Brain, Home, FileText } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

export default function VideoTutorials() {
  const { user } = useAuth()

  const videoCollections = [
    {
      title: 'Constitutional and Administrative Law',
      course: 'Constitutional Law',
      totalVideos: 18,
      watchedVideos: 12,
      progress: 67,
      totalHours: 14.5,
      instructor: 'Dr. Margaret Thompson',
      topics: ['Parliamentary Sovereignty', 'Rule of Law', 'Judicial Review', 'Constitutional Reform'],
      color: 'blue',
    },
    {
      title: 'Contract Law Video Series',
      course: 'Contract Law',
      totalVideos: 24,
      watchedVideos: 11,
      progress: 45,
      totalHours: 20.5,
      instructor: 'Prof. James Mitchell',
      topics: ['Formation', 'Terms & Conditions', 'Consideration', 'Breach & Remedies'],
      color: 'purple',
    },
    {
      title: 'Property Law Masterclass',
      course: 'Property Law',
      totalVideos: 15,
      watchedVideos: 12,
      progress: 80,
      totalHours: 12.0,
      instructor: 'Dr. Sarah Williams',
      topics: ['Land Registration', 'Leasehold & Freehold', 'Co-ownership', 'Mortgages'],
      color: 'green',
    },
    {
      title: 'Criminal Law Essentials',
      course: 'Criminal Law',
      totalVideos: 21,
      watchedVideos: 5,
      progress: 23,
      totalHours: 18.0,
      instructor: 'Prof. David Chen',
      topics: ['Actus Reus', 'Mens Rea', 'Defences', 'Sentencing'],
      color: 'red',
    },
    {
      title: 'Tort Law Foundation',
      course: 'Tort Law',
      totalVideos: 20,
      watchedVideos: 0,
      progress: 0,
      totalHours: 16.5,
      instructor: 'Dr. Emma Roberts',
      topics: ['Negligence', 'Defamation', 'Trespass', 'Nuisance'],
      color: 'yellow',
    },
    {
      title: 'Equity and Trusts Series',
      course: 'Equity and Trusts',
      totalVideos: 19,
      watchedVideos: 0,
      progress: 0,
      totalHours: 15.5,
      instructor: 'Prof. Richard Adams',
      topics: ['Trust Creation', 'Beneficiary Rights', 'Breach of Trust', 'Remedies'],
      color: 'indigo',
    },
  ]

  const recentlyWatched = [
    {
      title: 'Parliamentary Sovereignty Explained',
      course: 'Constitutional and Administrative Law',
      duration: '45:30',
      watched: '2 hours ago',
      progress: 100,
      icon: BookOpen,
      instructor: 'Dr. Margaret Thompson',
      color: 'blue',
    },
    {
      title: 'Consideration in Contracts',
      course: 'Contract Law',
      duration: '38:15',
      watched: '1 day ago',
      progress: 65,
      icon: FileText,
      instructor: 'Prof. James Mitchell',
      color: 'purple',
    },
    {
      title: 'Land Registration Process',
      course: 'Property Law',
      duration: '42:00',
      watched: '3 hours ago',
      progress: 100,
      icon: Home,
      instructor: 'Dr. Sarah Williams',
      color: 'green',
    },
  ]

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
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
        {/* Recently Watched Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-normal text-black mb-1">Continue Watching</h2>
          <p className="text-gray-600 text-sm mb-6">Pick up where you left off</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {recentlyWatched.map((video, idx) => {
              const color = colorMap[video.color as keyof typeof colorMap]
              const IconComponent = video.icon

              return (
                <div key={idx} className={`rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer`}>
                  <div className={`relative h-40 ${color.bg} flex items-center justify-center`}>
                    <IconComponent className="w-16 h-16 text-gray-400" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{video.course}</p>
                    <p className="text-xs text-gray-500 mb-3">By {video.instructor}</p>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{video.duration}</span>
                        <span className="text-xs text-gray-600">{video.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${color.accent}`}
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">Watched {video.watched}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Video Collections Section */}
        <div>
          <h2 className="text-2xl font-normal text-black mb-1">All Video Series</h2>
          <p className="text-gray-600 text-sm mb-6">Browse through structured video collections for each course</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoCollections.map((collection, idx) => {
              const color = colorMap[collection.color as keyof typeof colorMap]
              const watchedPercentage = Math.round((collection.watchedVideos / collection.totalVideos) * 100)

              return (
                <div
                  key={idx}
                  className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                          {collection.course}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{collection.title}</h3>
                        <p className="text-sm text-gray-600">Instructor: {collection.instructor}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Videos</span>
                        <span className="font-semibold text-gray-900">
                          {collection.watchedVideos}/{collection.totalVideos}
                        </span>
                      </div>

                      {collection.watchedVideos > 0 && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${color.accent}`}
                              style={{ width: `${watchedPercentage}%` }}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Duration</span>
                        <span className="font-semibold text-gray-900">{collection.totalHours}h</span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Topics Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {collection.topics.map((topic, tidx) => (
                          <span
                            key={tidx}
                            className={`text-xs px-3 py-1 rounded-full ${color.bg} ${color.text} font-medium`}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Info */}
                    <div className={`mb-6 p-3 rounded-lg ${color.bg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Progress</span>
                        <span className={`text-sm font-semibold ${color.text}`}>{watchedPercentage}%</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      {collection.watchedVideos > 0 ? 'Continue Watching' : 'Start Series'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Learning Stats */}
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
                  <p className="text-2xl font-semibold text-gray-900">28</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">This month</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hours Watched</p>
                  <p className="text-2xl font-semibold text-gray-900">24h</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">Total watched</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saved Videos</p>
                  <p className="text-2xl font-semibold text-gray-900">7</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">For later viewing</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Learning Streak</p>
                  <p className="text-2xl font-semibold text-gray-900">12 days</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium">Keep watching!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
