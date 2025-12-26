import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Award, TrendingUp, LogOut, Settings, Home, BarChart3, Users, HelpCircle, Menu, X, Bell, HelpCircle as QuestionIcon, Book, Video, Grid, Brain, FileText, Bot, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png';

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Mock user stats
  const userStats = {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    totalHours: 24,
    currentStreak: 7,
    progressPercentage: 35,
    averageScore: '78%',
    lastActive: '2 hours ago',
  }

  const courses = [
    {
      id: 1,
      title: 'Press FLK 2',
      progress: 65,
      hours: 12,
      status: 'in-progress',
    },
    {
      id: 2,
      title: 'SQE1 - Practice Questions',
      progress: 0,
      hours: 0,
      status: 'not-started',
    },
    {
      id: 3,
      title: 'Fundamentals of Law',
      progress: 100,
      hours: 10,
      status: 'completed',
    },
  ]

  const learningModes = [
    {
      title: 'Start Reading',
      description: 'Our most comprehensive study materials',
      icon: '📖',
    },
    {
      title: 'Watch Videos',
      description: 'Learn from expert-led video walkthroughs',
      icon: '🎥',
    },
    {
      title: 'Practice Questions',
      description: 'Test your knowledge with quizzes',
      icon: '✓',
    },
  ]

  const gettingStartedTips = [
    {
      title: 'Complete Your Profile',
      description: 'Add a profile picture and bio',
      icon: '👤',
    },
    {
      title: 'Set a Study Schedule',
      description: 'Allocate dedicated study hours daily',
      icon: '⏰',
    },
    {
      title: 'Join the Community',
      description: 'Check discussions to see progress',
      icon: '👥',
    },
    {
      title: 'Track Your Progress',
      description: 'Review your performance metrics',
      icon: '📊',
    },
  ]

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
            <NavItem icon={<Home className="w-5 h-5" />} label="Home" active={true} open={sidebarOpen} />
            <NavItem icon={<BookOpen className="w-5 h-5" />} label="My Courses" open={sidebarOpen} />
            <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Progress" open={sidebarOpen} />
            <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" open={sidebarOpen} />
          </div>          {/* Community */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
          <div className="space-y-2">
            <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" open={sidebarOpen} />
            <NavItem icon={<QuestionIcon className="w-5 h-5" />} label="Practice Questions" open={sidebarOpen} />
            <NavItem icon={<Video className="w-5 h-5" />} label="Video Tutorial" open={sidebarOpen} />
            <NavItem icon={<Grid className="w-5 h-5" />} label="Flashcard" open={sidebarOpen} />
            <NavItem icon={<Brain className="w-5 h-5" />} label="Quizzes" open={sidebarOpen} />
            <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" open={sidebarOpen} />
          </div>

          {/* Learning Tools */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Tools</p>}
          <div className="space-y-2">
            <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" open={sidebarOpen} />
            <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" open={sidebarOpen} />
            <NavItem icon={<Clock className="w-5 h-5" />} label="Key Timeframes" open={sidebarOpen} />
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
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome {user?.first_name || 'Konrad'}! 👋
              </h1>
              <p className="text-gray-600">Keep up the momentum!</p>
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
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search topics, lessons, or resources..."
              className="w-full px-4 py-3 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Courses Completed"
              value={userStats.coursesCompleted}
              icon={<Award className="w-6 h-6 text-yellow-600" />}
              bgColor="bg-yellow-100"
            />
            <StatCard
              label="In Progress"
              value={userStats.coursesEnrolled - userStats.coursesCompleted}
              icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
              bgColor="bg-blue-100"
            />
            <StatCard
              label="Total Hours"
              value={`${userStats.totalHours}h`}
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              bgColor="bg-purple-100"
            />
            <StatCard
              label="Study Streak"
              value={`${userStats.currentStreak} days`}
              icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
              bgColor="bg-orange-100"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2 cols on desktop) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Courses Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.hours} hours</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {course.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            course.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{course.progress}% complete</p>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  Continue Learning
                </button>
              </div>

              {/* Learning Modes */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {learningModes.map((mode, idx) => (
                    <button
                      key={idx}
                      className="p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <div className="text-4xl mb-3">{mode.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{mode.title}</h3>
                      <p className="text-sm text-gray-600">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for you</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Constitutional Law', 'Criminal Law', 'Property Law'].map((course, idx) => (
                    <button
                      key={idx}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{course}</h3>
                      <p className="text-sm text-gray-600 mb-3">Recommended based on your progress</p>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Enroll →
                      </button>
                    </button>
                  ))}
                </div>
              </div>

              {/* Getting Started Tips */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting started tips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gettingStartedTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="text-3xl flex-shrink-0">{tip.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                        <p className="text-sm text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Overall Progress</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray={`${3.14 * 100 * (userStats.progressPercentage / 100)} ${3.14 * 100}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{userStats.progressPercentage}%</span>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">Keep going! You're making progress.</p>
              </div>

              {/* Average Score */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Average Score</h3>
                  <span className="text-2xl font-bold text-green-600">{userStats.averageScore}</span>
                </div>
                <p className="text-sm text-gray-600">Great progress! Keep studying.</p>
              </div>

              {/* AI Tutor CTA */}
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Need help?</h3>
                    <p className="text-sm opacity-90">Chat with Angel AI</p>
                  </div>
                  <span className="text-3xl">🤖</span>
                </div>
                <button className="w-full bg-white text-orange-600 hover:bg-gray-100 font-semibold py-2 rounded-lg transition-colors">
                  Chat with Angel AI →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  bgColor,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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

