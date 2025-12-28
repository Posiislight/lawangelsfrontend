import { BarChart3, Home, BookOpen, HelpCircle, Menu, X, Brain, FileText, Bot, Lightbulb, Clock, HelpCircle as QuestionIcon, Grid, Book, Video } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
    <div className="flex h-screen bg-gray-50 font-worksans">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <img src={logo} alt="logo" className='w-14' />
                <img src={logotext} alt="logo" className='w-[93px] h-[20px] mt-2 -mx-2' />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-6">
          {/* My Learning */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">My Learning</p>}
          <div className="space-y-2">
            <Link to="/dashboard" className="block">
              <NavItem icon={<Home className="w-5 h-5" />} label="Home" open={sidebarOpen} />
            </Link>
            <Link to="/my-courses" className="block">
              <NavItem icon={<BookOpen className="w-5 h-5" />} label="My Courses" open={sidebarOpen} />
            </Link>
            <Link to="/progress" className="block">
              <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Progress" active={true} open={sidebarOpen} />
            </Link>
            <Link to="/practice" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" open={sidebarOpen} />
            </Link>
          </div>          {/* Community */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
          <div className="space-y-2">
            <Link to="/textbook" className="block">
              <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" open={sidebarOpen} />
            </Link>
            <Link to="/practice-questions" className="block">
              <NavItem icon={<QuestionIcon className="w-5 h-5" />} label="Practice Questions" open={sidebarOpen} />
            </Link>
            <Link to="/video-tutorials" className="block">
              <NavItem icon={<Video className="w-5 h-5" />} label="Video Tutorial" open={sidebarOpen} />
            </Link>
            <Link to="/flashcards" className="block">
              <NavItem icon={<Grid className="w-5 h-5" />} label="Flashcard" open={sidebarOpen} />
            </Link>
            <Link to="/quizzes" className="block">
              <NavItem icon={<Brain className="w-5 h-5" />} label="Quizzes" open={sidebarOpen} />
            </Link>
            <Link to="/mock-questions" className="block">
              <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Tools */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Tools</p>}
          <div className="space-y-2">
            <Link to="/angel-ai" className="block">
              <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" open={sidebarOpen} />
            </Link>
            <Link to="/sqe-tips" className="block">
              <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" open={sidebarOpen} />
            </Link>
            <Link to="/key-timeframes" className="block">
              <NavItem icon={<Clock className="w-5 h-5" />} label="Key Timeframes" open={sidebarOpen} />
            </Link>
          </div>
        </nav>

        {/* Settings & User Profile */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.first_name || 'User'}</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  open,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  open: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      } ${open ? '' : 'justify-center'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="text-sm">{label}</span>}
    </button>
  )
}
