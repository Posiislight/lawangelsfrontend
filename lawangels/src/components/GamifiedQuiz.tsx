import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Heart, Zap, ArrowLeft, ArrowRight, Loader, Scale,
    HelpCircle, Timer, X, Check
} from 'lucide-react'
import {
    topicQuizApi,
} from '../services/topicQuizApi'
import type {
    TopicQuestion,
    SubmitAnswerResponse,
    TopicQuizAttempt
} from '../services/topicQuizApi'

interface GameState {
    attempt: TopicQuizAttempt | null
    currentQuestion: TopicQuestion | null
    questionNumber: number
    totalQuestions: number
    livesRemaining: number
    pointsEarned: number
    currentStreak: number
    selectedAnswer: string | null
    answerResult: SubmitAnswerResponse | null
    isSubmitting: boolean
    eliminatedOptions: string[]
    showExplanation: boolean
}

export default function GamifiedQuiz() {
    const { attemptId } = useParams<{ topic: string; attemptId: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const startTimeRef = useRef<number>(Date.now())

    const [state, setState] = useState<GameState>({
        attempt: null,
        currentQuestion: null,
        questionNumber: 1,
        totalQuestions: 5,
        livesRemaining: 3,
        pointsEarned: 0,
        currentStreak: 0,
        selectedAnswer: null,
        answerResult: null,
        isSubmitting: false,
        eliminatedOptions: [],
        showExplanation: false,
    })

    // Load initial question
    useEffect(() => {
        const loadQuestion = async () => {
            if (!attemptId) return

            try {
                setLoading(true)
                const attemptIdNum = parseInt(attemptId, 10)

                // Get attempt and current question
                const [attempt, questionData] = await Promise.all([
                    topicQuizApi.getAttempt(attemptIdNum),
                    topicQuizApi.getCurrentQuestion(attemptIdNum)
                ])

                setState(prev => ({
                    ...prev,
                    attempt,
                    currentQuestion: questionData.question,
                    questionNumber: questionData.question_number,
                    totalQuestions: questionData.total_questions,
                    livesRemaining: questionData.lives_remaining,
                    pointsEarned: questionData.points_earned,
                    currentStreak: questionData.current_streak,
                }))

                startTimeRef.current = Date.now()
                setError(null)
            } catch (err) {
                console.error('Error loading question:', err)
                setError(err instanceof Error ? err.message : 'Failed to load question')
            } finally {
                setLoading(false)
            }
        }

        loadQuestion()
    }, [attemptId])

    const handleSelectAnswer = (label: string) => {
        if (state.answerResult || state.isSubmitting) return
        setState(prev => ({ ...prev, selectedAnswer: label }))
    }

    const handleSubmitAnswer = async () => {
        if (!state.selectedAnswer || !state.currentQuestion || !attemptId) return

        setState(prev => ({ ...prev, isSubmitting: true }))

        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

        try {
            const result = await topicQuizApi.submitAnswer(
                parseInt(attemptId, 10),
                state.currentQuestion.id,
                state.selectedAnswer,
                timeSpent
            )

            setState(prev => ({
                ...prev,
                answerResult: result,
                livesRemaining: result.lives_remaining,
                pointsEarned: result.total_points,
                currentStreak: result.current_streak,
                showExplanation: true,
                isSubmitting: false,
            }))

            // If quiz ended, redirect after a delay
            if (result.quiz_status !== 'in_progress') {
                setTimeout(() => {
                    navigate(`/quiz/results/${attemptId}`)
                }, 2000)
            }
        } catch (err) {
            console.error('Error submitting answer:', err)
            setError(err instanceof Error ? err.message : 'Failed to submit answer')
            setState(prev => ({ ...prev, isSubmitting: false }))
        }
    }

    const handleNextQuestion = () => {
        if (!state.answerResult?.next_question) {
            navigate(`/quiz/results/${attemptId}`)
            return
        }

        setState(prev => ({
            ...prev,
            currentQuestion: prev.answerResult!.next_question,
            questionNumber: prev.questionNumber + 1,
            selectedAnswer: null,
            answerResult: null,
            showExplanation: false,
            eliminatedOptions: [],
        }))

        startTimeRef.current = Date.now()
    }

    const handleUseFiftyFifty = async () => {
        if (!attemptId || state.attempt?.fifty_fifty_used) return

        try {
            const result = await topicQuizApi.useFiftyFifty(parseInt(attemptId, 10))
            setState(prev => ({
                ...prev,
                eliminatedOptions: result.eliminated_options,
                attempt: prev.attempt ? { ...prev.attempt, fifty_fifty_used: true } : null,
            }))
        } catch (err) {
            console.error('Error using 50/50:', err)
        }
    }

    const getProgressPercentage = () => {
        return ((state.questionNumber - 1) / state.totalQuestions) * 100
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading quiz...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-100 to-amber-200 p-3 md:p-4 font-worksans overflow-x-hidden">
            {/* Header Bar */}
            <div className="max-w-4xl mx-auto mb-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Top Row on Mobile: Badge + Stats */}
                    <div className="w-full md:w-auto flex justify-between md:justify-start items-center gap-4">
                        {/* User Badge */}
                        <div className="flex items-center bg-white rounded-full pl-2 pr-6 py-2 shadow-md border-2 border-slate-100">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                                    {state.currentStreak > 0 ? '🔥' : '📚'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs font-bold text-slate-800 w-5 h-5 flex items-center justify-center rounded-full border border-white">
                                    {state.questionNumber}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-bold text-slate-600">
                                    {state.currentStreak > 0 ? `${state.currentStreak} Streak!` : 'Quiz Mode'}
                                </p>
                                <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lives & Points (Visible on mobile right side) */}
                        <div className="flex md:hidden items-center gap-2">
                            <div className="flex items-center bg-red-100 text-red-500 px-2 py-1.5 rounded-xl border border-red-200">
                                <Heart className={`w-4 h-4 mr-1 ${state.livesRemaining < 3 ? 'animate-pulse' : ''}`} fill="currentColor" />
                                <span className="font-bold text-sm">{state.livesRemaining}</span>
                            </div>
                            <div className="flex items-center bg-cyan-500 text-white px-2 py-1.5 rounded-xl shadow-lg">
                                <Zap className="w-4 h-4 mr-1" />
                                <span className="font-bold text-sm">{state.pointsEarned}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar (Full width on mobile, middle on desktop) */}
                    <div className="flex-1 px-2 md:px-12 w-full max-w-2xl">
                        <div className="relative pt-6 pb-2">
                            <div className="flex justify-between mb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                <span>Start</span>
                                <span className="text-cyan-500">Q{state.questionNumber}</span>
                                <span>Finish</span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(state.questionNumber / state.totalQuestions) * 100}%` }}
                                />
                            </div>
                            {/* Progress markers */}
                            <div className="absolute top-6 left-0 w-full h-4 flex justify-between px-1 items-center pointer-events-none">
                                {Array.from({ length: state.totalQuestions }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all ${i < state.questionNumber - 1
                                            ? 'bg-teal-400'
                                            : i === state.questionNumber - 1
                                                ? 'bg-cyan-500 scale-125 ring-4 ring-cyan-200'
                                                : 'bg-slate-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-slate-500 mt-1">
                            <span>Q1</span>
                            <span>Q{state.totalQuestions}</span>
                        </div>
                    </div>

                    {/* Lives & Points (Desktop Only) */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center bg-red-100 text-red-500 px-3 py-1.5 rounded-xl border border-red-200">
                            <Heart className={`w-5 h-5 mr-1 ${state.livesRemaining < 3 ? 'animate-pulse' : ''}`} fill="currentColor" />
                            <span className="font-bold text-lg">{state.livesRemaining}</span>
                        </div>
                        <div className="flex items-center bg-cyan-500 text-white px-4 py-2 rounded-xl shadow-lg">
                            <Zap className="w-5 h-5 mr-1.5" />
                            <span className="font-bold text-lg">{state.pointsEarned} pts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Question Card */}
            <main className="max-w-3xl mx-auto relative">
                {/* Decorative blurs */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-orange-300/30 rounded-full blur-xl" />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyan-300/30 rounded-full blur-xl" />

                <div className="bg-white rounded-xl shadow-lg border-b-4 border-slate-200 overflow-hidden relative z-10">
                    <div className="p-4 md:p-6">
                        {/* Points Stake Badge */}
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold mb-6 border border-orange-200">
                            <span></span>
                            <span>100 Points Stake</span>
                        </div>

                        {/* Question */}
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-md flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300 border-2 border-white">
                                    <Scale className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base md:text-lg font-normal text-slate-800 leading-snug">
                                    {state.currentQuestion?.text}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Answer Options */}
                    <div className="bg-slate-50 p-4 md:p-6 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {state.currentQuestion?.options.map((option) => {
                                const isEliminated = state.eliminatedOptions.includes(option.label)
                                const isSelected = state.selectedAnswer === option.label
                                const isCorrect = state.answerResult?.correct_answer === option.label
                                const isWrong = state.answerResult && isSelected && !isCorrect

                                let buttonClass = 'bg-white border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50'
                                let labelClass = 'bg-slate-100 text-slate-500'

                                if (isEliminated) {
                                    buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-50 cursor-not-allowed'
                                } else if (state.answerResult) {
                                    if (isCorrect) {
                                        buttonClass = 'bg-green-50 border-2 border-green-400'
                                        labelClass = 'bg-green-500 text-white'
                                    } else if (isWrong) {
                                        buttonClass = 'bg-red-50 border-2 border-red-400'
                                        labelClass = 'bg-red-500 text-white'
                                    }
                                } else if (isSelected) {
                                    buttonClass = 'bg-cyan-50 border-2 border-cyan-400 ring-2 ring-cyan-200'
                                    labelClass = 'bg-cyan-500 text-white'
                                }

                                return (
                                    <button
                                        key={option.label}
                                        onClick={() => handleSelectAnswer(option.label)}
                                        disabled={isEliminated || !!state.answerResult || state.isSubmitting}
                                        className={`group relative flex items-center p-3 rounded-lg transition-all duration-200 w-full text-left ${buttonClass}`}
                                    >
                                        <div className={`w-8 h-8 rounded-md font-medium flex items-center justify-center mr-3 transition-colors text-sm ${labelClass}`}>
                                            {state.answerResult && isCorrect ? (
                                                <Check className="w-6 h-6" />
                                            ) : state.answerResult && isWrong ? (
                                                <X className="w-6 h-6" />
                                            ) : (
                                                option.label
                                            )}
                                        </div>
                                        <span className={`text-sm font-light ${isEliminated ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {option.text}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Explanation (shown after answer) */}
                    {state.showExplanation && state.answerResult && (
                        <div className={`p-6 border-t ${state.answerResult.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${state.answerResult.is_correct ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                    {state.answerResult.is_correct ? (
                                        <Check className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <X className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold mb-1 ${state.answerResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                        {state.answerResult.is_correct ? `Correct! +${state.answerResult.points_earned} points` : 'Incorrect'}
                                    </h3>
                                    <p className="text-slate-600">{state.answerResult.explanation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="mt-4 flex justify-between items-center">
                    {/* Power-ups */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleUseFiftyFifty}
                            disabled={state.attempt?.fifty_fifty_used || !!state.answerResult}
                            className={`group relative w-12 h-12 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center transition-all
                ${state.attempt?.fifty_fifty_used || state.answerResult ? 'opacity-50 cursor-not-allowed' : 'hover:text-orange-500 hover:border-orange-400'}`}
                            title="50/50 - Remove 2 wrong answers"
                        >
                            <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                            {!state.attempt?.fifty_fifty_used && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    1
                                </span>
                            )}
                        </button>
                        <button
                            disabled
                            className="w-12 h-12 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed"
                            title="Time Freeze (coming soon)"
                        >
                            <Timer className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/quizzes')}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Exit
                        </button>

                        {state.answerResult ? (
                            <button
                                onClick={handleNextQuestion}
                                className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg active:translate-y-1 transition-all flex items-center gap-2"
                            >
                                {state.answerResult.next_question ? 'Next Question' : 'See Results'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={!state.selectedAnswer || state.isSubmitting}
                                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
                  ${state.selectedAnswer && !state.isSubmitting
                                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white active:translate-y-1'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {state.isSubmitting ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        Submit Answer
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </main >
        </div >
    )
}
