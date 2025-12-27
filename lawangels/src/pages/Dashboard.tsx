import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Clock, TrendingUp, Home, BarChart3, HelpCircle, Menu, X, Bell, HelpCircle as QuestionIcon, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Target, CheckCircle, Calendar, Trophy, Lock } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png';

export default function Dashboard() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

  const learningModes = [
    {
      title: 'Start Reading',
      description: 'Dive into comprehensive study materials and textbooks',
      icon: '📖',
      bgColor: 'bg-blue-100 border-blue-200',
    },
    {
      title: 'Watch Videos',
      description: 'Learn from expert-led video tutorials and walkthroughs',
      icon: '🎥',
      bgColor: 'bg-purple-100 border-purple-200',
    },
    {
      title: 'Practice Questions',
      description: 'Test your knowledge with quizzes and mock examinations',
      icon: '✓',
      bgColor: 'bg-green-100 border-green-200',
    },
  ]

  const quickStats = [
    {
      title: "Today's Goal",
      value: '2/3',
      unit: 'hours',
      subtitle: '1 hour remaining',
      icon: Target,
      iconColor: 'text-orange-600',
      progress: 66,
      color: 'orange',
      
    },
    {
      title: 'Completed This Week',
      value: '18',
      unit: 'lessons',
      subtitle: '+3 from last week',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      color: 'green',
      
    },
    {
      title: 'Next Mock Exam',
      value: '2',
      unit: 'days',
      subtitle: 'Property Law - Full Mock',
      icon: Calendar,
      iconColor: 'text-red-600',
      color: 'red',
      
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
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                Welcome {user?.first_name || 'Konrad'}! 👋
              </h1>
              <p className="text-gray-600">Keep up the momentum!</p>
            </div>

            {/* Search Bar - Centered */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search courses, topics..."
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

        {/* Tab Switch */}
        <div className="px-2 pt-2 pb-2 border-gray-800 flex gap-3 rounded-lg bg-gray-200  w-max ml-8 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 font-medium transition-colors focus:outline-none border-none ${
              activeTab === 'overview'
                ? 'text-gray-500 hover:text-gray-700'
                : 'text-gray-900 bg-gray-200 rounded-t-lg'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`pb-3 px-2 font-medium transition-colors focus:outline-none border-none ${
              activeTab === 'tracker'
                ? 'text-gray-500 hover:text-gray-700'
                : 'text-gray-900 bg-gray-200 rounded-t-lg'
            }`}
          >
            Progress Tracker
          </button>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Overall Progress"
              value={userStats.coursesCompleted}
              icon={<Trophy className="w-6 h-6 text-yellow-600" />}
              bgColor="bg-yellow-100"
              feedback='+12% this week'
            />
            <StatCard
              label="Quiz Accuracy"
              value={userStats.coursesEnrolled - userStats.coursesCompleted}
              icon={<Target className="w-6 h-6 text-blue-600" />}
              bgColor="bg-blue-100"
              feedback='+8% improvement'
            />
            <StatCard
              label="Study Time"
              value={`${userStats.totalHours}h`}
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              bgColor="bg-purple-100"
              feedback='This month'
            />
            <StatCard
              label="Weekly Streak"
              value={`${userStats.currentStreak} days`}
              icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
              bgColor="bg-orange-100"
              feedback='keep it up'
            />
          </div>

          {/* Main Grid */}
          {/* Choose Your Learning Mode (large cards) */}
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-black mb-1">Choose Your Learning Mode</h2>
            <p className="text-gray-500 mb-6">Select how you'd like to study today</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {learningModes.map((mode, idx) => (
                <div key={idx} className={`relative rounded-2xl p-8 border ${mode.bgColor}`}> 
                  <div className="absolute left-8 top-1/4 -translate-y-1/2 text-6xl font-extrabold text-gray-400 opacity-60 select-none">{`0${idx + 1}`}</div>
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex-1">
                      <h3 className="text-xl font-normal text-gray-900 mb-2 pt-20">{mode.title}</h3>
                      <p className="text-sm text-gray-600 mb-6">{mode.description}</p>
                    </div>
                    <div className="mt-auto">
                      <button className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 bg-transparent">
                        <span className="text-2xl">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          {/* Quick Stats Cards */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickStats.map((stat, idx) => {
                const IconComponent = stat.icon
                return (
                  <div key={idx} className="rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <IconComponent className={`w-6 h-6 ${stat.iconColor} flex-shrink-0 mt-1`} />
                      <div className="flex flex-col items-start flex-1">
                        <div className="text-left">
                          <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-normal text-gray-900">{stat.value}</span>
                          <span className="text-2xl font-normal text-gray-900">{stat.unit}</span>
                        </div>
                        <div className="text-left mt-4">
                          <p className="text-xs text-gray-500 mb-2">{stat.subtitle}</p>
                        </div>
                      </div>
                    </div>
                    {stat.progress && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stat.color === 'orange' ? 'bg-orange-500' : stat.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stat.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {/* Pick Up Where You Left Off */}
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-black mb-1">Pick Up Where You Left Off</h2>
            <p className="text-gray-600 text-sm mb-6">Continue your learning journey across reading, videos, and practice</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reading Card */}
              <div className="rounded-lg p-6 border-t-4 border-t-blue-500 border border-blue-600 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">READING</span>
                  <span className="text-xs text-gray-500">Chapter 4 of 24</span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Constitutional Law</h3>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Parliamentary Sovereignty</h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">12 hrs left</span>
                  <span className="text-sm font-semibold text-gray-900">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '67%' }} />
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1">
                  Continue learning <span>→</span>
                </button>
              </div>

              {/* Watching Card */}
              <div className="rounded-lg p-6 border-t-4 border-t-purple-500 border border-purple-500 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">WATCHING</span>
                  <span className="text-xs text-gray-500">Video 3 of 8</span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Contract Law</h3>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Consideration in Contracts</h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">15.20 remaining</span>
                  <span className="text-sm font-semibold text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="h-2 rounded-full bg-purple-500" style={{ width: '45%' }} />
                </div>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1">
                  Continue learning <span>→</span>
                </button>
              </div>

              {/* Practicing Card */}
              <div className="rounded-lg p-6 border-t-4 border-t-green-500 border border-green-500 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">PRACTICING</span>
                  <span className="text-xs text-gray-500">Question 16 of 20</span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Property Law</h3>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Land Registration</h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">4 questions left</span>
                  <span className="text-sm font-semibold text-gray-900">80%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '80%' }} />
                </div>
                <button className="text-green-600 hover:text-green-700 font-medium text-sm inline-flex items-center gap-1">
                  Continue learning <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Your Courses */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 rounded-lg">
              <div>
                <h2 className="text-2xl font-normal text-black">Your Courses</h2>
                <p className="text-gray-600 text-sm">Each course includes reading materials, video tutorials, and practice questions</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View all →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Constitutional and Administrative Law */}
              <div className="rounded-3xl p-4 border border-gray-200 bg-white relative">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-normal text-gray-900">Constitutional and<br/>Administrative Law</h3>
                </div>
                <span className="absolute top-0 right-0 bg-[#0AB5FF] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">Active</span>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '67%' }} />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Book className="w-5 h-5 text-blue-600" />
                    <span>Reading</span>
                    <span className="ml-auto font-semibold">16/24</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Video className="w-5 h-5 text-purple-600" />
                    <span>Videos</span>
                    <span className="ml-auto font-semibold">12/18</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Practice</span>
                    <span className="ml-auto font-semibold">80/120</span>
                  </div>
                </div>
              </div>

              {/* Contract Law */}
              <div className="rounded-lg p-6 border border-gray-200 bg-white">
                <h3 className="font-normal text-gray-900 mb-4">Contract Law</h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '45%' }} />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Book className="w-5 h-5 text-blue-600" />
                    <span>Reading</span>
                    <span className="ml-auto font-semibold">14/32</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Video className="w-5 h-5 text-purple-600" />
                    <span>Videos</span>
                    <span className="ml-auto font-semibold">11/24</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Practice</span>
                    <span className="ml-auto font-semibold">81/180</span>
                  </div>
                </div>
              </div>

              {/* Property Law */}
              <div className="rounded-3xl p-4 border border-gray-200 bg-white">
                <h3 className="font-normal text-gray-900 mb-4">Property Law</h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '80%' }} />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Book className="w-5 h-5 text-blue-600" />
                    <span>Reading</span>
                    <span className="ml-auto font-semibold">16/20</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Video className="w-5 h-5 text-purple-600" />
                    <span>Videos</span>
                    <span className="ml-auto font-semibold">12/15</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Practice</span>
                    <span className="ml-auto font-semibold">112/140</span>
                  </div>
                </div>
              </div>

              {/* Criminal Law */}
              <div className="rounded-3xl p-4 border border-gray-200 bg-white">
                <h3 className="font-normal text-gray-900 mb-4">Criminal Law</h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '23%' }} />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600 font-medium mb-3">Learning Content</p>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Book className="w-5 h-5 text-blue-600" />
                    <span>Reading</span>
                    <span className="ml-auto font-semibold">6/28</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Video className="w-5 h-5 text-purple-600" />
                    <span>Videos</span>
                    <span className="ml-auto font-semibold">5/21</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Practice</span>
                    <span className="ml-auto font-semibold">37/160</span>
                  </div>
                </div>
              </div>

              {/* Tort Law - Locked */}
              <div className="rounded-3xl p-4 border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-normal text-gray-900">Tort Law</h3>
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Complete previous courses to unlock</p>
              </div>

              {/* Equity and Trusts - Locked */}
              <div className="rounded-3xl p-4 border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-normal text-gray-900">Equity and Trusts</h3>
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Complete previous courses to unlock</p>
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
  feedback
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  bgColor: string
  feedback: string 

}) {
  const feedbackColor = feedback.toString().startsWith('+') ? 'text-green-600' : feedback.toString().startsWith('-') ? 'text-red-600' : 'text-gray-600'
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-3xl font-normal text-gray-900 mb-2">{value}</p>
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className={`text-sm ${feedbackColor} mb-2`}>{feedback}</p>
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

