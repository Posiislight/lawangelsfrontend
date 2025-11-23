import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader, BarChart3 } from 'lucide-react'
import { quizApi } from '../services/quizApi'
import type { ExamAttempt, QuestionAnswer } from '../services/quizApi'

interface TopicResult {
  topic: string
  correct: number
  total: number
  percentage: number
  color: string
  icon: string
}

export default function Results() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<(QuestionAnswer & { question: any })[]>([])
  const [topicResults, setTopicResults] = useState<TopicResult[]>([])

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (!attemptId) {
          setError('Invalid attempt ID')
          return
        }

        setLoading(true)
        const attemptIdNum = parseInt(attemptId, 10)
        console.log(`Fetching results for attempt: ${attemptIdNum}`)

        if (isNaN(attemptIdNum)) {
          setError('Invalid attempt ID format')
          setLoading(false)
          return
        }

        try {
          // Fetch the review data which includes attempt and answers
          const reviewData = await quizApi.getReview(attemptIdNum)
          console.log('Review data received:', reviewData)

          // The backend returns ExamAttemptSerializer which has 'answers' directly
          // Map to the expected structure
          const attemptData = reviewData as any
          setAttempt(attemptData)

          // Answers are nested in the attempt object
          const answersData = attemptData.answers || []
          console.log('Answers data:', answersData)
          setAnswers(answersData)

          // Group results by topic (derived from question difficulty or text patterns)
          const topicMap = groupByTopic(answersData)
          setTopicResults(Array.from(topicMap.values()))

          setLoading(false)
        } catch (apiError) {
          console.error('API Error fetching results:', apiError)
          const errorMsg =
            apiError instanceof Error
              ? apiError.message
              : 'Failed to load results from API'
          setError(errorMsg)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load results'
        console.error('Full error:', errorMessage)
        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchResults()
  }, [attemptId])

  // Group answers by topic based on question categorization
  const groupByTopic = (
    answers: (QuestionAnswer & { question: any })[]
  ): Map<string, TopicResult> => {
    const topicMap = new Map<string, TopicResult>()
    const topicColors: { [key: string]: { color: string; icon: string } } = {
      'Contract Law': { color: 'bg-blue-100', icon: '📋' },
      'Criminal Law': { color: 'bg-green-100', icon: '⚖️' },
      'Property Law': { color: 'bg-purple-100', icon: '🏠' },
      'Family Law': { color: 'bg-red-100', icon: '👨‍👩‍👧' },
      'Land Law': { color: 'bg-yellow-100', icon: '📍' },
      'Trusts': { color: 'bg-indigo-100', icon: '🎁' },
      'Commercial Law': { color: 'bg-orange-100', icon: '💼' },
      'Tax Law': { color: 'bg-teal-100', icon: '💰' },
      'Professional Conduct': { color: 'bg-pink-100', icon: '⭐' },
      'Wills & Administration': { color: 'bg-gray-100', icon: '📜' },
    }

    // Extract topic from question text or use a default categorization
    answers.forEach((answer) => {
      // Try to extract topic from question text or use difficulty as fallback
      let topic = extractTopic(answer.question?.text || '')

      if (!topicMap.has(topic)) {
        const colorInfo = topicColors[topic] || {
          color: 'bg-slate-100',
          icon: '❓',
        }
        topicMap.set(topic, {
          topic,
          correct: 0,
          total: 0,
          percentage: 0,
          color: colorInfo.color,
          icon: colorInfo.icon,
        })
      }

      const topicResult = topicMap.get(topic)!
      topicResult.total += 1
      if (answer.is_correct) {
        topicResult.correct += 1
      }
      topicResult.percentage = Math.round((topicResult.correct / topicResult.total) * 100)
    })

    return topicMap
  }

  // Extract topic from question text based on keywords
  const extractTopic = (questionText: string): string => {
    const lowerText = questionText.toLowerCase()

    // Topic detection based on keywords
    if (
      lowerText.includes('contract') ||
      lowerText.includes('agreement') ||
      lowerText.includes('offer') ||
      lowerText.includes('acceptance')
    ) {
      return 'Contract Law'
    } else if (
      lowerText.includes('criminal') ||
      lowerText.includes('crime') ||
      lowerText.includes('offence') ||
      lowerText.includes('guilty')
    ) {
      return 'Criminal Law'
    } else if (
      lowerText.includes('property') ||
      lowerText.includes('estate') ||
      lowerText.includes('tenancy') ||
      lowerText.includes('lease')
    ) {
      return 'Property Law'
    } else if (
      lowerText.includes('family') ||
      lowerText.includes('divorce') ||
      lowerText.includes('marriage') ||
      lowerText.includes('custody')
    ) {
      return 'Family Law'
    } else if (
      lowerText.includes('land') ||
      lowerText.includes('title') ||
      lowerText.includes('registration')
    ) {
      return 'Land Law'
    } else if (
      lowerText.includes('trust') ||
      lowerText.includes('trustee') ||
      lowerText.includes('beneficiary')
    ) {
      return 'Trusts'
    } else if (
      lowerText.includes('commercial') ||
      lowerText.includes('business') ||
      lowerText.includes('company')
    ) {
      return 'Commercial Law'
    } else if (lowerText.includes('tax') || lowerText.includes('income')) {
      return 'Tax Law'
    } else if (lowerText.includes('professional') || lowerText.includes('conduct')) {
      return 'Professional Conduct'
    } else if (
      lowerText.includes('will') ||
      lowerText.includes('administration') ||
      lowerText.includes('estate')
    ) {
      return 'Wills & Administration'
    }

    return 'General Knowledge'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="text-[#E17100] animate-spin" />
          <p className="text-[#314158] font-medium">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-semibold text-[#DC2626] mb-2">Error Loading Results</h2>
          <p className="text-[#7F1D1D] mb-6">{error || 'Unable to load results'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-[#0F172B] text-white rounded-lg hover:bg-[#1a1f3a] transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    )
  }

  // Use actual number of questions attempted, not total exam questions
  const totalQuestions = answers.length
  const correctAnswers = answers.filter((a) => a.is_correct).length
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const passed = scorePercentage >= (attempt.exam?.passing_score_percentage || 70)

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <header className="bg-[#0F172B] border-b border-[#1D293D] shadow-lg sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 text-[#CAD5E2] hover:text-white transition"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Profile</span>
            </button>
            <div className="bg-[#E17100] text-white px-4 py-2 rounded-lg text-xs font-medium">
              Results: {attempt.exam?.title || 'Mock Test'}
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Score Card */}
          <div
            className={`rounded-2xl shadow-lg p-8 mb-8 border-2 ${
              passed
                ? 'bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] border-[#10B981]'
                : 'bg-gradient-to-br from-[#FEF2F2] to-[#FEFCE8] border-[#EF4444]'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Large Score */}
              <div className="md:col-span-2 flex flex-col justify-center">
                <p className={`text-sm font-medium mb-2 ${passed ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                  YOUR SCORE
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-6xl font-bold ${
                      passed ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {scorePercentage}%
                  </span>
                  <span className={`text-2xl font-semibold ${passed ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B] font-medium mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-[#1D293D]">{totalQuestions}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B] font-medium mb-1">Correct Answers</p>
                  <p className="text-2xl font-bold text-[#10B981]">{correctAnswers}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B] font-medium mb-1">Incorrect Answers</p>
                  <p className="text-2xl font-bold text-[#EF4444]">{totalQuestions - correctAnswers}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B] font-medium mb-1">Pass Required</p>
                  <p className="text-2xl font-bold text-[#314158]">
                    {attempt.exam?.passing_score_percentage || 70}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 size={24} className="text-[#E17100]" />
              <h2 className="text-2xl font-bold text-[#1D293D]">Topic Breakdown</h2>
            </div>

            <div className="space-y-4">
              {topicResults.map((topic, index) => (
                <div key={index} className="border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition">
                  {/* Topic Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <h3 className="font-semibold text-[#1D293D]">{topic.topic}</h3>
                        <p className="text-sm text-[#64748B]">
                          {topic.correct} of {topic.total} correct
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          topic.percentage >= 70 ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}
                      >
                        {topic.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#E2E8F0] rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        topic.percentage >= 70 ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                      }`}
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          
        </div>
      </main>
    </div>
  )
}
