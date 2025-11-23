import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Zap, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import { quizApi } from '../services/quizApi'
import type { Question, ExamAttempt } from '../services/quizApi'

type AnswerState = 'unanswered' | 'answered' | 'navigated'

interface ExamState {
  loading: boolean
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
        setState(prev => ({ ...prev, loading: true }))
        
        // Create new attempt
        console.log('Creating exam attempt...')
        const attempt = await quizApi.startExam(1, false)
        console.log('Attempt created:', attempt)
        
        // Load the 40 randomly selected questions for this attempt
        console.log('Fetching questions for attempt:', attempt.id)
        const questions = await quizApi.getAttemptQuestions(attempt.id)
        console.log('Questions loaded:', questions.length)
        
        // Load timing config
        const config = await quizApi.getExamTimingConfig()
        
        setState(prev => ({
          ...prev,
          loading: false,
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
        
        fetch(`http://localhost:8000/api/exam-attempts/${state.attempt.id}/submit-answer/`, {
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

  const handleSubmitAnswer = async () => {
    if (!state.selectedAnswer || !state.attempt) return

    try {
      const question = state.questions[state.currentQuestion]
      
      // Submit answer to record in database (async, but don't wait for response)
      quizApi.submitAnswer(
        state.attempt.id,
        question.id,
        state.selectedAnswer,
        10 // Default 10 seconds per question
      ).catch(error => {
        console.error('Error recording answer:', error)
      })

      // Check if answer is correct using loaded question data
      const isCorrect = state.selectedAnswer === question.correct_answer

      setState(prev => {
        const updatedAnswers = { ...prev.answeredQuestions }
        updatedAnswers[prev.currentQuestion] = {
          answer: state.selectedAnswer!,
          isCorrect: isCorrect,
        }
        
        return {
          ...prev,
          answeredQuestions: updatedAnswers,
          answerState: 'answered',
        }
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit answer';
      console.error('Error submitting answer:', error);
      
      // Check if it's a permission issue
      if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        alert('Your session has expired or you do not have access to this exam attempt. Please refresh the page and start a new attempt.');
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMsg 
      }))
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="text-[#E17100] animate-spin" />
          <p className="text-[#314158] font-medium">Loading exam...</p>
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
                  const isCorrectOption = option.label === question.correct_answer
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
