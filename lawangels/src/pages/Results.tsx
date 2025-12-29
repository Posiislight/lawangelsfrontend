import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Home, RefreshCw, ChevronDown, ChevronUp, Loader, Trophy, TrendingUp, BarChart3, Timer, Target, CheckCheckIcon } from 'lucide-react'
import { quizApi } from '../services/quizApi'
import type { ExamAttempt, QuestionAnswer } from '../services/quizApi'


interface AnswerWithQuestion extends QuestionAnswer {
  question: {
    id: number
    text: string
    question_number: number
    difficulty: 'easy' | 'medium' | 'hard'
    topic: string  // Used for topic analytics - kept for future breakdown feature
    correct_answer: string
    explanation: string
    options: Array<{
      id: number
      label: string
      text: string
    }>
  }
}

type AnswerFilter = 'all' | 'wrong' | 'right'

export default function Results() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [filter, setFilter] = useState<AnswerFilter>('all')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (!attemptId) {
          setError('Invalid attempt ID')
          return
        }

        setLoading(true)
        const attemptIdNum = parseInt(attemptId, 10)

        if (isNaN(attemptIdNum)) {
          setError('Invalid attempt ID format')
          setLoading(false)
          return
        }

        const reviewData = await quizApi.getReview(attemptIdNum)
        setAttempt(reviewData)

        // Use questions array (full exam questions) as source of truth
        // This includes unanswered questions which would be missing from 'answers'
        const allQuestions = reviewData.questions || []

        if (allQuestions.length > 0) {
          // Map all questions to answers (creating placeholders for unanswered ones)
          const processedAnswers: AnswerWithQuestion[] = allQuestions.map(q => {
            // Find if there's an answer for this question
            // Check both finding by question object id (if populated) or direct question_id
            const matchingAnswer = reviewData.answers?.find(a =>
              (a.question && a.question.id === q.id) ||
              (a.question_id === q.id)
            )

            if (matchingAnswer) {
              // User answered this question
              return {
                ...matchingAnswer,
                question: q as any // Ensure type match
              } as AnswerWithQuestion
            } else {
              // User did NOT answer this question (count as wrong)
              return {
                id: Math.random(), // Temp ID
                question_id: q.id,
                question: q as any,
                selected_answer: '',
                is_correct: false,
                time_spent_seconds: 0
              } as AnswerWithQuestion
            }
          })
          setAnswers(processedAnswers)
        } else {
          // Fallback for backward compatibility or if questions not returned
          setAnswers((reviewData.answers || []) as AnswerWithQuestion[])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(err instanceof Error ? err.message : 'Failed to load results')
        setLoading(false)
      }
    }

    fetchResults()
  }, [attemptId])

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172B]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="text-[#00BCD4] animate-spin" />
          <p className="text-white font-medium">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172B]">
        <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Results</h2>
          <p className="text-red-300 mb-6">{error || 'Unable to load results'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-white text-[#0F172B] rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalQuestions = answers.length
  const correctAnswers = answers.filter(a => a.is_correct).length
  const incorrectAnswers = totalQuestions - correctAnswers
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  // Calculate time
  const totalTimeSeconds = attempt.time_spent_seconds || answers.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0)
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSeconds / totalQuestions) : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Get motivational message based on score
  const getMotivationalContent = () => {
    if (scorePercentage >= 80) {
      return {
        icon: <Trophy className="w-6 h-6 text-green-600" />,
        title: 'Excellent Work!',
        message: "You're ready for the exam. Keep up the great work!",
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        msgCardBg: 'bg-green-50/50',
        msgCardBorder: 'border-green-600'
      }
    } else if (scorePercentage >= 60) {
      return {
        icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
        title: 'Good Progress!',
        message: 'You\'re on the right track. Review the explanations for missed questions.',
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        msgCardBg: 'bg-blue-50/50',
        msgCardBorder: 'border-blue-600'
      }
    } else {
      return {
        icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
        title: 'Keep Going!',
        message: 'Everyone starts somewhere. Review the explanations and practice more.',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
        borderColor: 'border-orange-200',
        msgCardBg: 'bg-orange-50/50',
        msgCardBorder: 'border-orange-600'
      }
    }
  }

  const motivational = getMotivationalContent()

  // Filter answers
  const filteredAnswers = answers.filter(answer => {
    if (filter === 'all') return true
    if (filter === 'wrong') return !answer.is_correct
    if (filter === 'right') return answer.is_correct
    return true
  })

  // Get message for current filter
  const getFilterMessage = () => {
    if (filter === 'wrong' && incorrectAnswers === 0) {
      return "Perfect! No incorrect answers to show."
    }
    if (filter === 'right' && correctAnswers === 0) {
      return "No correct answers yet. Keep practicing!"
    }
    if (filter === 'wrong') {
      return `Focus on these ${incorrectAnswers} questions you got wrong.`
    }
    if (filter === 'right') {
      return `Nice work! You got ${correctAnswers} questions right.`
    }
    return `Showing all ${totalQuestions} questions. Click any question to see details.`
  }

  // Calculate stroke dashoffset for circular progress
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference

  return (
    <div className="min-h-screen bg-white font-worksans">
      {/* Header */}
      <header className="bg-[#0F172B] border-b border-[#1E293B] py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-normal text-white text-center">Your Results</h1>
          <p className="text-gray-400 text-sm text-center mt-1">Here's how you did on this practice test</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Score Card */}
        <div
          style={{ background: 'linear-gradient(135deg, rgba(15, 23, 43, 0.05) 0%, rgba(0, 0, 0, 0) 50%, rgba(225, 113, 0, 0.05) 100%)' }}
          className="border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Circular Score */}
            <div className="relative">
              <svg width="150" height="150" className="transform -rotate-90">
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  stroke={scorePercentage >= 70 ? '#F97316' : '#EF4444'}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-normal text-[#0F172B]`}>
                  {scorePercentage}%
                </span>
                <span className="text-gray-500 text-sm">Overall Score</span>
              </div>
            </div>

            {/* Motivational Message */}
            <div className={`flex-1 border p-6 rounded-lg ${motivational.msgCardBg} ${motivational.msgCardBorder}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-xl">{motivational.icon}</span>
                </div>
                <h2 className="text-xl font-normal text-gray-900">{motivational.title}</h2>
              </div>
              <p className="text-gray-600">{motivational.message}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div
              style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, rgba(208, 250, 229, 0.5) 100%)' }}
              className="rounded-xl p-4 text-center shadow-sm border border-green-900/50"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center border-1 border-green-900">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-500 text-sm">Correct</span>
              </div>
              <p className="text-3xl font-normal text-green-800">{correctAnswers}</p>
            </div>
            <div
              style={{ background: 'linear-gradient(135deg, #FFF1F2 0%, rgba(255, 228, 230, 0.5) 100%)' }}
              className="rounded-xl p-4 text-center shadow-sm border border-red-900/50"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 bg-red-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">✕</span>
                </div>
                <span className="text-gray-500 text-sm">Incorrect</span>
              </div>
              <p className="text-3xl font-normal text-red-800">{incorrectAnswers}</p>
            </div>
            <div
              style={{ background: 'rgba(224, 246, 255, 0.5)' }}
              className="rounded-xl p-4 text-center shadow-sm border border-blue-900/50"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">⏱</span>
                </div>
                <span className="text-blue-800 text-sm">Time</span>
              </div>
              <p className="text-3xl font-normal text-blue-800">{formatTime(totalTimeSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#0F172B] rounded-lg flex items-center justify-center">
              <span className="text-indigo-600"><TrendingUp className="w-4 h-4 text-white" /></span>
            </div>
            <h2 className="text-2xl font-normal text-gray-900">Performance Analytics</h2>
          </div>

          {/* Accuracy Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Accuracy Rate</span>
              <span className={`text-xs font-light px-2 py-0.5 rounded bg-[#0F172B] text-white`}>
                {scorePercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-[#0F172B]`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {correctAnswers} out of {totalQuestions} questions answered correctly
            </p>
          </div>

          {/* Time Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-[#0F172B] rounded-lg flex items-center justify-center p-4">
                  <span className="text-gray-600 text-xs text-white"><Timer className="w-4 h-4 text-white" /></span>
                </div>
                <span className="text-gray-500 text-sm">Total Time Spent</span>
              </div>
              <p className="text-2xl font-normal text-gray-900">{formatTime(totalTimeSeconds)}</p>
              <p className="text-xs text-gray-500">For {totalQuestions} questions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-[#0F172B] rounded-lg flex items-center justify-center p-4">
                  <span className="text-orange-600 text-xs text-white"><Target className="w-4 h-4 text-white" /></span>
                </div>
                <span className="text-gray-500 text-sm">Avg. Time/Question</span>
              </div>
              <p className="text-2xl font-normal text-gray-900">{formatTime(avgTimePerQuestion)}</p>
              <p className="text-xs text-gray-500">Pacing indicator</p>
            </div>
          </div>

          {/* Questions Completed Badge */}
          <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600"><CheckCheckIcon className="w-4 h-4 text-white" /></span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Questions Completed</p>
                <p className="text-sm text-gray-500">All questions answered</p>
              </div>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {totalQuestions}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Review Your Answers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Your Answers</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                All ({totalQuestions})
              </button>
              <button
                onClick={() => setFilter('wrong')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'wrong' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
              >
                Wrong ({incorrectAnswers})
              </button>
              <button
                onClick={() => setFilter('right')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'right' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
              >
                Right ({correctAnswers})
              </button>
            </div>
          </div>

          {/* Filter Message */}
          <div className={`mb-4 p-3 rounded-lg text-sm ${filter === 'wrong' ? 'bg-red-50 text-red-700' :
            filter === 'right' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
            {getFilterMessage()}
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredAnswers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-400 text-xl">
                    {filter === 'wrong' ? '✓' : '✕'}
                  </span>
                </div>
                <p className="text-gray-500">
                  {filter === 'wrong' ? 'No incorrect answers to show.' : 'No correct answers yet. Keep practicing!'}
                </p>
              </div>
            ) : (
              filteredAnswers.map((answer, index) => (
                <div
                  key={answer.id || index}
                  className={`border rounded-xl overflow-hidden transition ${answer.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                    }`}
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleQuestion(answer.question?.id || index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${answer.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {answer.is_correct ? '✓' : '✕'}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Question {answer.question?.question_number || index + 1}</p>
                        <p className={`text-sm ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                          {answer.is_correct ? '✓ Correct' : '✕ Incorrect'}
                        </p>
                      </div>
                    </div>
                    {expandedQuestions.has(answer.question?.id || index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  {expandedQuestions.has(answer.question?.id || index) && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4">
                        <p className="text-gray-700 mb-4">{answer.question?.text}</p>

                        {/* Options */}
                        <div className="space-y-2 mb-4">
                          {answer.question?.options?.map((option) => (
                            <div
                              key={option.label}
                              className={`p-3 rounded-lg border ${option.label === answer.question?.correct_answer
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : option.label === answer.selected_answer && !answer.is_correct
                                  ? 'bg-red-100 border-red-300 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-600'
                                }`}
                            >
                              <span className="font-medium">{option.label}.</span> {option.text}
                              {option.label === answer.question?.correct_answer && (
                                <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                              )}
                              {option.label === answer.selected_answer && option.label !== answer.question?.correct_answer && (
                                <span className="ml-2 text-red-600 font-medium">✕ Your answer</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        {answer.question?.explanation && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Explanation</p>
                            <p className="text-sm text-blue-700">{answer.question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate(`/mock-questions`)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0AB5FF] rounded-xl text-white font-medium hover:from-cyan-600 hover:to-blue-600 transition shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Retake Test
          </button>
        </div>
      </main>
    </div>
  )
}