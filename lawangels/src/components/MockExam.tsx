import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Zap, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import { quizApi } from '../services/quizApi'
import type { Question, ExamAttempt } from '../services/quizApi'

type AnswerState = 'unanswered' | 'answered' | 'navigated'
type LoadingStep = 'initializing' | 'creating-attempt' | 'loading-questions' | 'loading-config' | 'ready'

interface ExamState {
  loading: boolean
  loadingStep: LoadingStep
  error: string | null
  examId: number
  attemptId: number | null
  questions: Question[]
  attempt: ExamAttempt | null
  timeLeft: number
  speedReaderEnabled: boolean
  currentQuestion: number
  selectedAnswer: string | null
  answerState: AnswerState
  answeredQuestions: Record<number, { answer: string; isCorrect: boolean }>
  speedReaderTime: number
}

export default function MockExam() {
  const navigate = useNavigate()
  const [state, setState] = useState<ExamState>({
    loading: true,
    loadingStep: 'initializing',
    error: null,
    examId: 1,
    attemptId: null,
    questions: [],
    attempt: null,
    timeLeft: 3600,
    speedReaderEnabled: false,
    currentQuestion: 0,
    selectedAnswer: null,
    answerState: 'unanswered',
    answeredQuestions: {},
    speedReaderTime: 70,
  })

  // Track which answers have been submitted to backend to avoid duplicates
  const submittedAnswersRef = useRef<Set<number>>(new Set())

  // Initialize exam and create attempt
  useEffect(() => {
    const initializeExam = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, loadingStep: 'creating-attempt' }))
        
        // Retrieve CSRF token from cookies
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1]

        if (!csrfToken) {
          throw new Error('CSRF token is missing. Ensure the user is authenticated and the CSRF cookie is set.')
        }

        // Create new attempt
        console.log('Creating exam attempt...')
        const attempt = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/exam-attempts/start/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ exam_id: 1, is_mock: false }),
        }).then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error('Authentication credentials are missing or invalid.')
            }
            throw new Error(`Failed to create exam attempt. Status: ${res.status}`)
          }
          return res.json()
        })

        console.log('Attempt created:', attempt)
        setState(prev => ({ ...prev, loadingStep: 'loading-questions' }))
        
        // Load the 40 randomly selected questions for this attempt
        console.log('Fetching questions for attempt:', attempt.id)
        const questions = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/exam-attempts/${attempt.id}/questions/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        }).then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error('Authentication credentials are missing or invalid while fetching questions.')
            }
            throw new Error(`Failed to fetch questions. Status: ${res.status}`)
          }
          return res.json()
        })

        console.log('Questions loaded:', questions.length)
        setState(prev => ({ ...prev, loadingStep: 'loading-config' }))
        
        // Load timing config
        const config = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/exam-timing-config/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        }).then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error('Authentication credentials are missing or invalid while fetching exam timing config.')
            }
            throw new Error(`Failed to fetch exam timing config. Status: ${res.status}`)
          }
          return res.json()
        })

        setState(prev => ({
          ...prev,
          loading: false,
          loadingStep: 'ready',
          questions: questions,
          attempt: attempt,
          attemptId: attempt.id,
          timeLeft: config.default_duration_minutes * 60,
          speedReaderTime: config.default_speed_reader_seconds,
        }))
      } catch (error) {
        console.error('Error initializing exam:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load exam',
        }))
      }
    }
    
    initializeExam()
  }, [])

  // Main timer effect
  useEffect(() => {
    if (state.loading || !state.attempt) return

    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [state.loading, state.attempt])

  // Speed reader auto-advance effect
  useEffect(() => {
    if (!state.speedReaderEnabled || state.questions.length === 0 || state.answerState === 'unanswered') return

    const speedTimer = setInterval(() => {
      setState(prev => {
        if (prev.speedReaderTime <= 1) {
          // Auto advance to next question
          if (prev.currentQuestion < prev.questions.length - 1) {
            return {
              ...prev,
              currentQuestion: prev.currentQuestion + 1,
              selectedAnswer: null,
              answerState: 'unanswered',
              speedReaderTime: 70,
            }
          }
          return prev
        }
        return {
          ...prev,
          speedReaderTime: prev.speedReaderTime - 1,
        }
      })
    }, 1000)

    return () => clearInterval(speedTimer)
  }, [state.speedReaderEnabled, state.currentQuestion, state.questions.length, state.answerState])

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSelectAnswer = (label: string) => {
    // Only allow selecting if haven't answered yet
    if (state.answerState === 'unanswered') {
      const question = state.questions[state.currentQuestion]
      const isCorrect = label === question.correct_answer

      setState(prev => {
        const updatedAnswers = { ...prev.answeredQuestions }
        updatedAnswers[prev.currentQuestion] = {
          answer: label,
          isCorrect: isCorrect,
        }

        return {
          ...prev,
          selectedAnswer: label,
          answerState: 'answered',
          answeredQuestions: updatedAnswers,
        }
      })

      // Fire-and-forget: Send to backend (don't wait for response)
      if (state.attempt && !submittedAnswersRef.current.has(state.currentQuestion)) {
        submittedAnswersRef.current.add(state.currentQuestion)
        
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/exam-attempts/${state.attempt.id}/submit-answer/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: question.id,
            selected_answer: label,
            time_spent_seconds: 10,
          }),
          credentials: 'include',
        }).catch(error => console.warn('Background answer submission failed:', error))
      }
    }
  }

  const handleNextQuestion = () => {
    if (state.currentQuestion < state.questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        answerState: 'unanswered',
        speedReaderTime: 70,
      }))
    }
  }

  const handlePreviousQuestion = () => {
    if (state.currentQuestion > 0) {
      const prevQuestion = state.currentQuestion - 1
      const savedAnswer = state.answeredQuestions[prevQuestion]

      setState(prev => ({
        ...prev,
        currentQuestion: prevQuestion,
        selectedAnswer: savedAnswer?.answer || null,
        answerState: savedAnswer ? 'navigated' : 'unanswered',
      }))
    }
  }

  const handleFinishExam = async () => {
    if (!state.attempt) {
      console.error('No attempt data available')
      return
    }

    try {
      console.log(`Finishing exam attempt ${state.attempt.id}...`)
      
      // End the exam attempt
      const completedAttempt = await quizApi.endExam(state.attempt.id)
      console.log('Exam completed:', completedAttempt)

      if (!completedAttempt.id) {
        throw new Error('No attempt ID in response')
      }

      console.log(`Navigating to results page: /results/${completedAttempt.id}`)
      // Navigate to results page
      navigate(`/results/${completedAttempt.id}`)
    } catch (error) {
      console.error('Error finishing exam:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to finish exam'
      alert(`Failed to finish exam: ${errorMsg}`)
    }
  }

  const handleConfirmFinish = () => {
    const answeredCount = Object.keys(state.answeredQuestions).length
    const totalQuestions = state.questions.length
    
    if (answeredCount < totalQuestions) {
      const unanswered = totalQuestions - answeredCount
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to finish the exam?`
      )
      if (!confirmed) return
    }

    handleFinishExam()
  }

  if (state.loading) {
    const steps: { step: LoadingStep; label: string; description: string }[] = [
      { step: 'creating-attempt', label: 'Initializing', description: 'Creating your exam session' },
      { step: 'loading-questions', label: 'Loading Questions', description: 'Fetching your 40 questions' },
      { step: 'loading-config', label: 'Preparing Timer', description: 'Setting up exam timer' },
    ]

    const currentStepIndex = steps.findIndex(s => s.step === state.loadingStep)
    const completedSteps = Math.max(0, currentStepIndex)

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-8 max-w-md">
          {/* Animated Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E17100] to-[#FE9A00] flex items-center justify-center animate-pulse">
              <Loader size={32} className="text-white animate-spin" />
            </div>
            <p className="text-[#1D293D] font-bold text-lg">Law Angels Quiz</p>
          </div>

          {/* Steps Progress */}
          <div className="w-full space-y-3">
            {steps.map((item, index) => {
              const isCompleted = index < completedSteps
              const isActive = index === currentStepIndex

              return (
                <div key={item.step} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                      isCompleted
                        ? 'bg-[#10B981] text-white'
                        : isActive
                        ? 'bg-[#E17100] text-white ring-2 ring-[#E17100] ring-offset-2'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium transition-colors ${
                        isActive ? 'text-[#E17100]' : isCompleted ? 'text-[#10B981]' : 'text-[#314158]'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-sm text-[#64748B]">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full">
            <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E17100] to-[#FE9A00] transition-all duration-500"
                style={{ width: `${((completedSteps + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-semibold text-[#DC2626] mb-2">Error Loading Exam</h2>
          <p className="text-[#7F1D1D]">{state.error}</p>
        </div>
      </div>
    )
  }

  if (state.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <p className="text-[#314158] font-medium">No questions available</p>
      </div>
    )
  }

  const question = state.questions[state.currentQuestion]
  const totalQuestions = state.questions.length
  const answeredCount = Object.keys(state.answeredQuestions).length
  const progressPercentage = (answeredCount / totalQuestions) * 100

  const showFeedback = state.answerState === 'answered' || state.answerState === 'navigated'
  const isAnswerCorrect = state.answeredQuestions[state.currentQuestion]?.isCorrect

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <header className="bg-[#0F172B] border-b border-[#1D293D] shadow-lg sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-3 text-[#CAD5E2] bg-[#0F172B] hover:text-white transition -mt-16">
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Profile</span>
            </button>
            <div className="bg-[#E17100] text-white px-4 py-2 rounded-lg text-xs font-medium mx-auto">
              Mock Test 1
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 bg-[#1D293D] px-6 py-3 rounded-xl border border-[#314158]">
                <Clock size={16} className="text-[#FE9A00]" />
                <span className="text-white font-medium">{formatTime(state.timeLeft)}</span>
              </div>

              <div className="text-[#CAD5E2] text-sm font-medium bg-[#1D293D] px-6 py-3 rounded-xl border border-[#314158]">
                Question {state.currentQuestion + 1}
              </div>
            </div>
          </div>

          {/* Speed Reader Toggle */}
          <div className="flex items-center justify-center gap-3 bg-[#1D293D] px-6 py-3 rounded-xl border border-[#314158] w-fit left-2 -mt-16">
            <button
              onClick={() => setState(prev => ({ ...prev, speedReaderEnabled: !prev.speedReaderEnabled }))}
              className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                state.speedReaderEnabled ? 'bg-[#FE9A00]' : 'bg-[#CBCED4]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.speedReaderEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <Zap size={16} className="text-[#FE9A00]" />
            <span className="text-[#E2E8F0] text-sm font-medium">Speed Reader</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto bg-[#FFFFFF]">
          {/* Speed Reader Banner */}
          {state.speedReaderEnabled && (
            <div className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] px-6 py-4 mb-6 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-[#E17100]" />
                  <span className="text-sm font-medium text-[#92400E]">Speed Reader Mode Active - Auto advance in {state.speedReaderTime} seconds</span>
                </div>
                <div className="w-64 bg-[#E5E7EB] rounded-full h-2 overflow-hidden flex-shrink-0">
                  <div
                    className="bg-[#E17100] h-full transition-all duration-300"
                    style={{ width: `${(state.speedReaderTime / 70) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="p-8">
              {/* Question Header */}
              <div className="flex gap-4 mb-8">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F172B] text-white font-medium text-sm flex-shrink-0">
                  {state.currentQuestion + 1}
                </div>
                <p className="text-base text-[#1D293D] leading-relaxed flex-1">
                  {question.text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {question.options.map((option) => {
                  const isSelected = state.selectedAnswer === option.label
                  const showCorrectHighlight = showFeedback && isSelected && isAnswerCorrect
                  const showIncorrectHighlight = showFeedback && isSelected && !isAnswerCorrect

                  return (
                    <div key={option.label}>
                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          showCorrectHighlight
                            ? 'bg-[#ECFDF5] border-[#10B981]'
                            : showIncorrectHighlight
                            ? 'bg-[#FEF2F2] border-[#EF4444]'
                            : isSelected && state.answerState !== 'unanswered'
                            ? 'bg-[#EFF6FF] border-[#3B82F6]'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CAD5E2]'
                        } ${state.answerState !== 'unanswered' ? 'cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option.label}
                          checked={isSelected}
                          onChange={() => handleSelectAnswer(option.label)}
                          disabled={state.answerState !== 'unanswered'}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-[#314158] min-w-6">{option.label}</span>
                        <span className="text-sm text-[#314158]">{option.text}</span>
                      </label>

                      {/* Feedback shown under selected option */}
                      {isSelected && showFeedback && isAnswerCorrect && (
                        <div className="bg-[#ECFDF5] border-2 border-[#10B981] rounded-xl p-6 mt-3 mb-3">
                          <div className="flex gap-3 mb-4">
                            <div className="text-[#10B981] text-2xl">✓</div>
                            <h3 className="text-lg font-medium text-[#059669]">Correct!</h3>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#059669] mb-2">Explanation:</p>
                            <p className="text-sm text-[#047857]">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}

                      {isSelected && showFeedback && !isAnswerCorrect && (
                        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl p-6 mt-3 mb-3">
                          <div className="flex gap-3 mb-4">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#EF4444] text-white text-lg font-bold flex-shrink-0">
                              ✕
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-[#DC2626]">Incorrect</h3>
                              <p className="text-sm text-[#EF4444]">The correct answer is {question.correct_answer}</p>
                            </div>
                          </div>
                          <div className="ml-9">
                            <p className="text-sm font-medium text-[#DC2626] mb-3">Explanation:</p>
                            <p className="text-sm text-[#7F1D1D] leading-relaxed">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Next Button Only */}
              <div className="flex justify-center">
                {state.answerState !== 'unanswered' && (
                  <button
                    onClick={handleNextQuestion}
                    disabled={state.currentQuestion >= totalQuestions - 1}
                    className={`px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                      state.currentQuestion < totalQuestions - 1
                        ? 'bg-[#0F172B] text-white hover:bg-[#1a1f3a]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next Question
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={state.currentQuestion === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  state.currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-[#0A0A0A] border-[#CAD5E2] hover:border-[#314158]'
                }`}
              >
                <ChevronLeft size={18} />
                <span className="text-sm font-medium">Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-wrap justify-center">
                  {[...Array(totalQuestions)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setState(prev => ({ ...prev, currentQuestion: i }))}
                      className={`w-10 h-10 rounded-full font-medium transition flex items-center justify-center ${
                        state.currentQuestion === i
                          ? 'bg-[#0F172B] text-white shadow-lg'
                          : state.answeredQuestions[i] !== undefined
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#E2E8F0] text-[#45556C]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={state.currentQuestion >= totalQuestions - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  state.currentQuestion >= totalQuestions - 1
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-[#0A0A0A] border-[#CAD5E2] hover:border-[#314158]'
                }`}
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden mb-4">
              <div
                className="bg-[#E17100] h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Finish Exam Button */}
            <div className="flex justify-center">
              <button
                onClick={handleConfirmFinish}
                className="px-8 py-3 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] transition shadow-lg"
              >
                Finish Exam
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
