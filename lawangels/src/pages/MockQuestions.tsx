import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, Bell, Home, BarChart3, HelpCircle, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Clock, ArrowRight, ChevronRight, AlertCircle, Target, CheckCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function MockQuestions() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const mockExams = [
    {
      title: 'Constitutional Law Full Mock',
      course: 'Constitutional Law',
      questions: 100,
      duration: '3 hours',
      passScore: 70,
      yourBestScore: 76,
      attemptsTaken: 3,
      averageScore: 74,
      difficulty: 'Exam Level',
      lastAttempt: '5 days ago',
      topics: ['Parliamentary Sovereignty', 'Judicial Review', 'Rule of Law', 'Constitutional Reform', 'Separation of Powers'],
      color: 'blue',
    },
    {
      title: 'Contract Law Mock Exam',
      course: 'Contract Law',
      questions: 95,
      duration: '2.5 hours',
      passScore: 70,
      yourBestScore: 68,
      attemptsTaken: 2,
      averageScore: 66,
      difficulty: 'Exam Level',
      lastAttempt: '2 weeks ago',
      topics: ['Formation', 'Terms & Conditions', 'Consideration', 'Breach', 'Remedies'],
      color: 'purple',
    },
    {
      title: 'Property Law Full Mock',
      course: 'Property Law',
      questions: 98,
      duration: '3 hours',
      passScore: 70,
      yourBestScore: 84,
      attemptsTaken: 4,
      averageScore: 81,
      difficulty: 'Exam Level',
      lastAttempt: '1 day ago',
      topics: ['Land Registration', 'Leasehold & Freehold', 'Co-ownership', 'Mortgages', 'Easements'],
      color: 'green',
    },
    {
      title: 'Criminal Law Mock Exam',
      course: 'Criminal Law',
      questions: 105,
      duration: '3 hours',
      passScore: 70,
      yourBestScore: 62,
      attemptsTaken: 1,
      averageScore: 62,
      difficulty: 'Exam Level',
      lastAttempt: '3 weeks ago',
      topics: ['Actus Reus', 'Mens Rea', 'Defences', 'Homicide', 'Theft', 'Sentencing'],
      color: 'red',
    },
    {
      title: 'Tort Law Full Mock',
      course: 'Tort Law',
      questions: 92,
      duration: '2.5 hours',
      passScore: 70,
      yourBestScore: 0,
      attemptsTaken: 0,
      averageScore: 0,
      difficulty: 'Exam Level',
      lastAttempt: 'Not attempted',
      topics: ['Negligence', 'Defamation', 'Trespass', 'Nuisance', 'Strict Liability'],
      color: 'yellow',
    },
    {
      title: 'Equity and Trusts Mock',
      course: 'Equity and Trusts',
      questions: 96,
      duration: '3 hours',
      passScore: 70,
      yourBestScore: 0,
      attemptsTaken: 0,
      averageScore: 0,
      difficulty: 'Exam Level',
      lastAttempt: 'Not attempted',
      topics: ['Trust Creation', 'Beneficiaries', 'Breach of Trust', 'Remedies', 'Equitable Relief'],
      color: 'indigo',
    },
  ]

  const recentAttempts = [
    {
      title: 'Property Law Full Mock',
      course: 'Property Law',
      score: 84,
      maxScore: 100,
      passed: true,
      passScore: 70,
      questionsCorrect: 82,
      totalQuestions: 98,
      completedAt: '1 day ago',
      duration: '2h 58m',
      color: 'green',
    },
    {
      title: 'Constitutional Law Full Mock',
      course: 'Constitutional Law',
      score: 76,
      maxScore: 100,
      passed: true,
      passScore: 70,
      questionsCorrect: 76,
      totalQuestions: 100,
      completedAt: '5 days ago',
      duration: '3h 12m',
      color: 'blue',
    },
    {
      title: 'Criminal Law Mock Exam',
      course: 'Criminal Law',
      score: 62,
      maxScore: 100,
      passed: false,
      passScore: 70,
      questionsCorrect: 65,
      totalQuestions: 105,
      completedAt: '3 weeks ago',
      duration: '2h 45m',
      color: 'red',
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
              <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" open={sidebarOpen} />
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
              <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" active={true} open={sidebarOpen} />
            </Link>
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
                📋 Mock Questions
              </h1>
              <p className="text-gray-600">Full-length mock exams simulating the real SQE experience</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search mock exams..."
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
          {/* Recent Attempts Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-normal text-black mb-1">Recent Attempts</h2>
            <p className="text-gray-600 text-sm mb-6">Review your latest mock exam performance</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {recentAttempts.map((attempt, idx) => {
                const color = colorMap[attempt.color as keyof typeof colorMap]
                
                return (
                  <div key={idx} className={`rounded-lg p-6 border border-gray-200 ${color.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${color.text} text-sm uppercase tracking-wide mb-2`}>Mock Exam</h3>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{attempt.title}</h4>
                        <p className="text-sm text-gray-600">{attempt.course}</p>
                      </div>
                      {attempt.passed ? (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                          <span className="text-green-600 font-bold">✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                          <span className="text-red-600 font-bold">✕</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{attempt.score}/{attempt.maxScore}</span>
                        <span className={`text-sm font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {attempt.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color.accent}`}
                          style={{ width: `${(attempt.score / attempt.maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {attempt.questionsCorrect}/{attempt.totalQuestions} correct • {attempt.duration} • {attempt.completedAt}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All Mock Exams Section */}
          <div>
            <h2 className="text-2xl font-normal text-black mb-1">All Mock Exams</h2>
            <p className="text-gray-600 text-sm mb-6">Take full-length mock exams to prepare for the SQE assessment</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockExams.map((exam, idx) => {
                const color = colorMap[exam.color as keyof typeof colorMap]
                const passPercentage = exam.attemptsTaken > 0 ? Math.round((exam.yourBestScore / 100) * 100) : 0

                return (
                  <div
                    key={idx}
                    className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                            {exam.course}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Questions</span>
                          <span className="font-semibold text-gray-900">{exam.questions}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-semibold text-gray-900">{exam.duration}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pass Score</span>
                          <span className="font-semibold text-gray-900">{exam.passScore}%</span>
                        </div>

                        {exam.attemptsTaken > 0 && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${color.accent}`}
                                style={{ width: `${passPercentage}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Best Score</p>
                                <p className="text-lg font-semibold text-gray-900">{exam.yourBestScore}%</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Avg Score</p>
                                <p className="text-lg font-semibold text-gray-900">{exam.averageScore}%</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Attempts</span>
                              <span className="font-semibold text-gray-900">{exam.attemptsTaken}</span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Attempt</span>
                          <span className="font-semibold text-gray-900">{exam.lastAttempt}</span>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Topics Covered</p>
                        <div className="flex flex-wrap gap-2">
                          {exam.topics.map((topic, tidx) => (
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
                        {exam.attemptsTaken > 0 ? 'Retake Exam' : 'Start Exam'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Exam Preparation Stats */}
          <div className="mt-12">
            <h2 className="text-2xl font-normal text-black mb-6">Your Mock Exam Stats</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Exams Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">10</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Total attempts</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">70%</p>
                  </div>
                </div>
                <p className="text-xs text-green-600 font-medium">7 out of 10 passed</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-semibold text-gray-900">73%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Across all exams</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hours Studied</p>
                    <p className="text-2xl font-semibold text-gray-900">28h</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Mock exam time</p>
              </div>
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
