import { HelpCircle, Home, BookOpen, BarChart3, Menu, X, Brain, FileText, Bot, Lightbulb, Clock, HelpCircle as QuestionIcon, Grid, Book, Video, CheckCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

interface PracticeQuestion {
  id: number
  title: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: number
  attempted: number
  correctAnswers: number
  status: 'completed' | 'in-progress' | 'not-started' | 'locked'
  timeLimit: string
  description: string
}

export default function Practice() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const practiceQuestions: PracticeQuestion[] = [
    {
      id: 1,
      title: 'Constitutional Law - Quick Quiz',
      category: 'Constitutional and Administrative Law',
      difficulty: 'easy',
      questions: 10,
      attempted: 10,
      correctAnswers: 9,
      status: 'completed',
      timeLimit: '15 mins',
      description: 'Basic concepts and definitions in constitutional law',
    },
    {
      id: 2,
      title: 'Contract Law - Application Questions',
      category: 'Contract Law',
      difficulty: 'medium',
      questions: 15,
      attempted: 12,
      correctAnswers: 10,
      status: 'in-progress',
      timeLimit: '45 mins',
      description: 'Scenario-based questions on contract formation and terms',
    },
    {
      id: 3,
      title: 'Property Law - Full Mock Exam',
      category: 'Property Law',
      difficulty: 'hard',
      questions: 50,
      attempted: 0,
      correctAnswers: 0,
      status: 'not-started',
      timeLimit: '2 hours',
      description: 'Complete property law examination with all topics',
    },
    {
      id: 4,
      title: 'Criminal Law - MCQs',
      category: 'Criminal Law',
      difficulty: 'medium',
      questions: 20,
      attempted: 20,
      correctAnswers: 18,
      status: 'completed',
      timeLimit: '60 mins',
      description: 'Multiple choice questions covering criminal law principles',
    },
    {
      id: 5,
      title: 'Tort Law - Practice Set',
      category: 'Tort Law',
      difficulty: 'hard',
      questions: 25,
      attempted: 0,
      correctAnswers: 0,
      status: 'locked',
      timeLimit: '90 mins',
      description: 'Advanced tort law questions and scenarios',
    },
    {
      id: 6,
      title: 'Trusts & Wills - Fundamentals',
      category: 'Trusts & Wills',
      difficulty: 'easy',
      questions: 12,
      attempted: 0,
      correctAnswers: 0,
      status: 'locked',
      timeLimit: '20 mins',
      description: 'Basic concepts in trusts and estate planning',
    },
  ]

  const filteredQuestions = filterDifficulty === 'all' 
    ? practiceQuestions 
    : practiceQuestions.filter(q => q.difficulty === filterDifficulty)

  const stats = {
    totalAttempted: practiceQuestions.reduce((acc, q) => acc + q.attempted, 0),
    totalCorrect: practiceQuestions.reduce((acc, q) => acc + q.correctAnswers, 0),
    accuracy: Math.round((practiceQuestions.reduce((acc, q) => acc + q.correctAnswers, 0) / practiceQuestions.reduce((acc, q) => acc + q.attempted, 0)) * 100) || 0,
    completed: practiceQuestions.filter(q => q.status === 'completed').length,
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-50 text-green-700' }
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-50 text-yellow-700' }
      case 'hard':
        return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-50 text-red-700' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-50 text-gray-700' }
    }
  }

  const getStatusDisplay = (status: string, attempted: number, questions: number) => {
    if (status === 'locked') return { text: 'Locked', icon: Lock, color: 'text-gray-400' }
    if (status === 'completed') return { text: 'Completed', icon: CheckCircle, color: 'text-green-600' }
    if (status === 'in-progress') return { text: `${attempted}/${questions}`, icon: null, color: 'text-blue-600' }
    return { text: 'Start', icon: null, color: 'text-gray-600' }
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
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" active={true} open={sidebarOpen} />
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
              <h1 className="text-2xl font-normal text-gray-900">Practice Questions</h1>
              <p className="text-sm text-gray-600 mt-1">Test your knowledge with practice questions and quizzes</p>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Questions Attempted</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.totalAttempted}</p>
              <p className="text-xs text-gray-500 mt-2">Across all categories</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Correct Answers</p>
              <p className="text-3xl font-semibold text-green-600">{stats.totalCorrect}</p>
              <p className="text-xs text-gray-500 mt-2">Well done!</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Accuracy Rate</p>
              <p className="text-3xl font-semibold text-blue-600">{stats.accuracy}%</p>
              <p className="text-xs text-gray-500 mt-2">Overall performance</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Quizzes Completed</p>
              <p className="text-3xl font-semibold text-purple-600">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-2">Out of {practiceQuestions.length}</p>
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="mb-8 flex gap-3">
            <button
              onClick={() => setFilterDifficulty('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterDifficulty === 'all'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Levels
            </button>
            <button
              onClick={() => setFilterDifficulty('easy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterDifficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setFilterDifficulty('medium')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterDifficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setFilterDifficulty('hard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterDifficulty === 'hard'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hard
            </button>
          </div>

          {/* Practice Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const colors = getDifficultyColor(question.difficulty)

              return (
                <div key={question.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{question.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{question.category}</p>
                        <p className="text-sm text-gray-600">{question.description}</p>
                      </div>

                      <div className="text-right ml-4">
                        {question.status === 'locked' ? (
                          <Lock className="w-6 h-6 text-gray-400" />
                        ) : question.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Questions</p>
                        <p className="text-lg font-semibold text-gray-900">{question.questions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Attempted</p>
                        <p className="text-lg font-semibold text-gray-900">{question.attempted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Correct</p>
                        <p className="text-lg font-semibold text-green-600">{question.correctAnswers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time Limit</p>
                        <p className="text-lg font-semibold text-gray-900">{question.timeLimit}</p>
                      </div>
                    </div>

                    {question.attempted > 0 && question.status !== 'locked' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round((question.correctAnswers / question.attempted) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.round((question.correctAnswers / question.attempted) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {question.status === 'locked' ? (
                        <button disabled className="flex-1 py-2 px-4 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 font-medium text-sm cursor-not-allowed">
                          Locked
                        </button>
                      ) : question.status === 'completed' ? (
                        <>
                          <button className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-medium text-sm hover:bg-blue-100 transition-colors">
                            Review
                          </button>
                          <button className="flex-1 py-2 px-4 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 font-medium text-sm hover:bg-gray-100 transition-colors">
                            Retake
                          </button>
                        </>
                      ) : (
                        <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                          {question.status === 'in-progress' ? 'Continue' : 'Start'} Practice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
