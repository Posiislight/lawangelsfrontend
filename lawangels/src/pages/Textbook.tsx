import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, Bell, Home, BarChart3, HelpCircle, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Clock, ArrowRight, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function Textbook() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const textbooks = [
    {
      title: 'Constitutional and Administrative Law',
      course: 'Constitutional Law',
      chapters: 24,
      currentChapter: 4,
      progress: 67,
      estimatedTime: '12 hrs',
      topics: ['Parliamentary Sovereignty', 'Rule of Law', 'Separation of Powers', 'Judicial Review'],
      color: 'blue',
      icon: BookOpen,
    },
    {
      title: 'Contract Law Fundamentals',
      course: 'Contract Law',
      chapters: 32,
      currentChapter: 7,
      progress: 45,
      estimatedTime: '18 hrs',
      topics: ['Formation of Contracts', 'Terms and Conditions', 'Consideration', 'Breach and Remedies'],
      color: 'purple',
      icon: BookOpen,
    },
    {
      title: 'Property Law Essentials',
      course: 'Property Law',
      chapters: 20,
      currentChapter: 16,
      progress: 80,
      estimatedTime: '8 hrs',
      topics: ['Land Registration', 'Leasehold and Freehold', 'Co-ownership', 'Mortgages'],
      color: 'green',
      icon: BookOpen,
    },
    {
      title: 'Criminal Law Principles',
      course: 'Criminal Law',
      chapters: 28,
      currentChapter: 6,
      progress: 23,
      estimatedTime: '22 hrs',
      topics: ['Actus Reus', 'Mens Rea', 'Defences', 'Sentencing'],
      color: 'red',
      icon: BookOpen,
    },
    {
      title: 'Tort Law Fundamentals',
      course: 'Tort Law',
      chapters: 26,
      currentChapter: 0,
      progress: 0,
      estimatedTime: '20 hrs',
      topics: ['Negligence', 'Strict Liability', 'Defences', 'Remedies'],
      color: 'yellow',
      icon: BookOpen,
    },
    {
      title: 'Equity and Trusts',
      course: 'Equity and Trusts',
      chapters: 22,
      currentChapter: 0,
      progress: 0,
      estimatedTime: '16 hrs',
      topics: ['Nature of Trusts', 'Constitution of Trusts', 'Beneficiaries Rights', 'Breach of Trust'],
      color: 'indigo',
      icon: BookOpen,
    },
  ]

  const recentlyViewed = [
    {
      title: 'Parliamentary Sovereignty',
      course: 'Constitutional and Administrative Law',
      chapter: 4,
      lastRead: '2 hours ago',
      progress: 67,
      color: 'blue',
    },
    {
      title: 'Consideration in Contracts',
      course: 'Contract Law',
      chapter: 7,
      lastRead: '1 day ago',
      progress: 45,
      color: 'purple',
    },
    {
      title: 'Land Registration',
      course: 'Property Law',
      chapter: 16,
      lastRead: '3 hours ago',
      progress: 80,
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
              <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Progress" open={sidebarOpen} />
            </Link>
            <Link to="/practice" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Modes */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
          <div className="space-y-2">
            <Link to="/textbook" className="block">
              <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" active={true} open={sidebarOpen} />
            </Link>
            <Link to="/practice-questions" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice Questions" open={sidebarOpen} />
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
              <h1 className="text-2xl font-normal text-gray-900">
                📖 Textbook Library
              </h1>
              <p className="text-gray-600">Comprehensive study materials for all your courses</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search textbooks, chapters..."
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
          {/* Recently Viewed Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-black mb-1">Continue Reading</h2>
            <p className="text-gray-600 text-sm mb-6">Pick up where you left off</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {recentlyViewed.map((item, idx) => {
                const color = colorMap[item.color as keyof typeof colorMap]
                return (
                  <div key={idx} className={`rounded-lg p-6 border border-gray-200 ${color.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className={`font-semibold ${color.text} text-sm uppercase tracking-wide`}>Chapter {item.chapter}</h3>
                      <ChevronRight className={`w-5 h-5 ${color.text}`} />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{item.course}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">Last read {item.lastRead}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.accent}`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All Textbooks Section */}
          <div>
            <h2 className="text-2xl font-normal text-black mb-1">All Textbooks</h2>
            <p className="text-gray-600 text-sm mb-6">Browse through comprehensive course materials</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {textbooks.map((textbook, idx) => {
                const color = colorMap[textbook.color as keyof typeof colorMap]
                const Icon = textbook.icon

                return (
                  <div
                    key={idx}
                    className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className="p-6">

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                            {textbook.course}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">{textbook.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Chapters</span>
                          <span className="font-semibold text-gray-900">
                            {textbook.currentChapter}/{textbook.chapters}
                          </span>
                        </div>

                        {textbook.progress > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-semibold text-gray-900">{textbook.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${color.accent}`}
                                style={{ width: `${textbook.progress}%` }}
                              />
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Estimated time</span>
                          <span className="font-semibold text-gray-900">{textbook.estimatedTime}</span>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Key Topics</p>
                        <div className="flex flex-wrap gap-2">
                          {textbook.topics.map((topic, tidx) => (
                            <span
                              key={tidx}
                              className={`text-xs px-3 py-1 rounded-full ${color.bg} ${color.text} font-medium`}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                        {textbook.progress > 0 ? 'Continue Reading' : 'Start Reading'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
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
