import { CheckCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

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

  return (
    <DashboardLayout>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === 'all'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            All Levels
          </button>
          <button
            onClick={() => setFilterDifficulty('easy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === 'easy'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Easy
          </button>
          <button
            onClick={() => setFilterDifficulty('medium')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilterDifficulty('hard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === 'hard'
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
    </DashboardLayout>
  )
}
