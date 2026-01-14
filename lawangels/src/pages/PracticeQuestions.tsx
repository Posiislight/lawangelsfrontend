import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ChevronLeft, BookOpen, CheckCircle2, XCircle, Loader } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import apiClient from '../api/client'
import { practiceQuestionsApi } from '../services/practiceQuestionsApi'
import type { PracticeCourse } from '../services/practiceQuestionsApi'

interface PracticeArea {
    letter: string
    name: string
    slug: string
    question_count: number
    questions?: {
        id: number
        title?: string
        text: string
        options: { label: string; text: string }[]
        correct_answer: string
        explanation: string
        difficulty: string
    }[]
}

interface TopicWithAreas {
    course: { name: string; slug: string }
    topic: { name: string; slug: string }
    areas: PracticeArea[]
    total_areas: number
    total_questions: number
}

type ViewMode = 'courses' | 'topics' | 'practice'

interface AnsweredQuestion {
    questionId: number
    selectedAnswer: string
    isCorrect: boolean
}

export default function PracticeQuestions() {
    const { courseSlug, topicSlug } = useParams<{ courseSlug?: string; topicSlug?: string }>()
    const navigate = useNavigate()

    // State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [courses, setCourses] = useState<PracticeCourse[]>([])
    const [topicData, setTopicData] = useState<TopicWithAreas | null>(null)
    const [selectedAreaIndex, setSelectedAreaIndex] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, AnsweredQuestion>>({})
    const [isMobileAreasOpen, setIsMobileAreasOpen] = useState(false)

    // Close mobile areas menu when selecting an area
    useEffect(() => {
        setIsMobileAreasOpen(false)
    }, [selectedAreaIndex])

    // Determine view mode from URL params
    const viewMode: ViewMode = topicSlug ? 'practice' : courseSlug ? 'topics' : 'courses'

    // Get current area and question
    const currentArea = topicData?.areas[selectedAreaIndex]
    const currentQuestion = currentArea?.questions?.[currentQuestionIndex]
    const questionKey = `${selectedAreaIndex}-${currentQuestionIndex}`

    // Fetch data based on view mode
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            try {
                if (topicSlug && courseSlug) {
                    // Fetch topic with areas using authenticated client
                    const response = await apiClient.get(`/practice-questions/${courseSlug}/${topicSlug}/`)
                    const data = response.data
                    setTopicData(data)
                    setSelectedAreaIndex(0)
                    setCurrentQuestionIndex(0)
                    setSelectedAnswer(null)
                    setShowFeedback(false)
                    setAnsweredQuestions({})
                } else {
                    // Fetch all courses
                    const data = await practiceQuestionsApi.getCourses()
                    setCourses(data.courses)
                }
            } catch (err) {
                console.error('Error fetching practice questions:', err)
                setError('Failed to load practice questions. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [courseSlug, topicSlug])

    // Handle area selection
    const handleSelectArea = (index: number) => {
        setSelectedAreaIndex(index)
        setCurrentQuestionIndex(0)
        setSelectedAnswer(null)
        setShowFeedback(false)
    }

    // Handle answer selection (just selects, doesn't submit)
    const handleSelectAnswer = (label: string) => {
        if (showFeedback || !currentQuestion) return
        setSelectedAnswer(label)
    }

    // Handle answer submission
    const handleSubmitAnswer = () => {
        if (!selectedAnswer || showFeedback || !currentQuestion) return

        setShowFeedback(true)

        const isCorrect = selectedAnswer === currentQuestion.correct_answer
        setAnsweredQuestions(prev => ({
            ...prev,
            [questionKey]: {
                questionId: currentQuestion.id,
                selectedAnswer: selectedAnswer,
                isCorrect
            }
        }))
    }

    // Navigate to next question
    const handleNextQuestion = () => {
        if (!currentArea?.questions) return

        if (currentQuestionIndex < currentArea.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1
            setCurrentQuestionIndex(nextIndex)

            // Check if next question was already answered
            const key = `${selectedAreaIndex}-${nextIndex}`
            const nextAnswer = answeredQuestions[key]
            if (nextAnswer) {
                setSelectedAnswer(nextAnswer.selectedAnswer)
                setShowFeedback(true)
            } else {
                setSelectedAnswer(null)
                setShowFeedback(false)
            }
        }
    }

    // Navigate to previous question
    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            const prevIndex = currentQuestionIndex - 1
            setCurrentQuestionIndex(prevIndex)

            const key = `${selectedAreaIndex}-${prevIndex}`
            const prevAnswer = answeredQuestions[key]
            if (prevAnswer) {
                setSelectedAnswer(prevAnswer.selectedAnswer)
                setShowFeedback(true)
            } else {
                setSelectedAnswer(null)
                setShowFeedback(false)
            }
        }
    }

    // Go to specific question
    const handleGoToQuestion = (index: number) => {
        setCurrentQuestionIndex(index)
        const key = `${selectedAreaIndex}-${index}`
        const answer = answeredQuestions[key]
        if (answer) {
            setSelectedAnswer(answer.selectedAnswer)
            setShowFeedback(true)
        } else {
            setSelectedAnswer(null)
            setShowFeedback(false)
        }
    }

    // Calculate stats for current area
    const getAreaStats = (areaIndex: number) => {
        const area = topicData?.areas[areaIndex]
        if (!area?.questions) return { answered: 0, correct: 0, total: 0 }

        let answered = 0
        let correct = 0
        area.questions.forEach((_, qIndex) => {
            const key = `${areaIndex}-${qIndex}`
            if (answeredQuestions[key]) {
                answered++
                if (answeredQuestions[key].isCorrect) correct++
            }
        })
        return { answered, correct, total: area.questions.length }
    }

    // Loading state - Skeleton loader
    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
                    {/* Header skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
                    </div>

                    {/* Course cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer bg-[length:200%_100%]"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Loading indicator */}
                    <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
                        <Loader className="w-5 h-5 animate-spin text-green-600" />
                        <span className="text-sm">Loading practice questions...</span>
                    </div>
                </div>

                <style>{`
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                    .animate-shimmer {
                        animation: shimmer 2s infinite linear;
                    }
                `}</style>
            </DashboardLayout>
        )
    }

    // Error state
    if (error) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => navigate('/practice-questions')}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Practice View - No questions available fallback
    if (viewMode === 'practice' && topicData && (!topicData.areas || topicData.areas.length === 0 || !currentQuestion)) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md text-center">
                        <BookOpen className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-yellow-700 mb-2">No Questions Available</h2>
                        <p className="text-yellow-600 mb-4">
                            Questions for {topicData.topic.name} are not available yet.
                        </p>
                        <button
                            onClick={() => navigate(`/practice-questions/${courseSlug}`)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                        >
                            Choose Another Topic
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Practice View with Left Sidebar for Areas
    if (viewMode === 'practice' && topicData && currentArea && currentQuestion) {
        const areaStats = getAreaStats(selectedAreaIndex)
        const isAnswerCorrect = answeredQuestions[questionKey]?.isCorrect

        return (
            <DashboardLayout>
                <div className="flex h-full relative">
                    {/* Mobile Areas Toggle Layer */}
                    {isMobileAreasOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsMobileAreasOpen(false)}
                        />
                    )}

                    {/* Left Sidebar - Areas */}
                    <div className={`
                        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
                        ${isMobileAreasOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between md:block">
                            <div>
                                <button
                                    onClick={() => navigate(`/practice-questions/${courseSlug}`)}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-3"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-sm">Back to Topics</span>
                                </button>
                                <h2 className="font-semibold text-gray-900">{topicData.topic.name}</h2>
                                <p className="text-xs text-gray-500">{topicData.course.name}</p>
                            </div>
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setIsMobileAreasOpen(false)}
                                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Areas List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Areas</p>
                            {topicData.areas.map((area, index) => {
                                const stats = getAreaStats(index)
                                const isSelected = index === selectedAreaIndex

                                return (
                                    <button
                                        key={area.slug}
                                        onClick={() => handleSelectArea(index)}
                                        className={`w-full text-left p-3 rounded-lg mb-1 transition ${isSelected
                                            ? 'bg-green-50 border-l-4 border-green-600'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold text-lg ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                                {area.letter}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                    {area.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {area.question_count} questions
                                                    </span>
                                                    {stats.answered > 0 && (
                                                        <span className={`text-xs ${stats.correct === stats.answered ? 'text-green-600' : 'text-gray-500'}`}>
                                                            ({stats.correct}/{stats.answered})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Overall Stats */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 safe-pb-mobile">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Progress</span>
                                <span className="font-semibold text-green-600">
                                    {Object.keys(answeredQuestions).length} / {topicData.total_questions}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 h-[calc(100vh-65px)] md:h-auto">
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 md:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Mobile Areas Toggle */}
                                    <button
                                        onClick={() => setIsMobileAreasOpen(true)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                    </button>

                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">
                                            {currentArea.letter}. {currentArea.name}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-500">
                                            Question {currentQuestionIndex + 1} of {currentArea.questions?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs md:text-sm text-gray-500">Area Score</p>
                                    <p className="text-base md:text-lg font-semibold text-green-600">
                                        {areaStats.correct}/{areaStats.answered}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="p-4 md:p-6 pb-20 md:pb-6">
                            <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden max-w-4xl mx-auto">
                                <div className="p-4 md:p-8">
                                    {/* Question Header */}
                                    <div className="flex gap-4 mb-6 md:mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-600 text-white text-sm md:text-base font-medium flex-shrink-0">
                                            {currentQuestionIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            {currentQuestion.title && (
                                                <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 leading-snug">
                                                    {currentQuestion.title}
                                                </h4>
                                            )}
                                            <p className="text-base md:text-lg text-gray-800 leading-relaxed">
                                                {currentQuestion.text}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Answer Options */}
                                    <div className="space-y-3 mb-8">
                                        {currentQuestion.options.map((option) => {
                                            const isSelected = selectedAnswer === option.label
                                            const isCorrectOption = option.label === currentQuestion.correct_answer
                                            const showCorrectHighlight = showFeedback && isCorrectOption
                                            const showIncorrectHighlight = showFeedback && isSelected && !isCorrectOption

                                            return (
                                                <label
                                                    key={option.label}
                                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${showCorrectHighlight
                                                        ? 'bg-green-50 border-green-500'
                                                        : showIncorrectHighlight
                                                            ? 'bg-red-50 border-red-500'
                                                            : isSelected
                                                                ? 'bg-blue-50 border-blue-500'
                                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                                        } ${showFeedback ? 'cursor-not-allowed' : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="answer"
                                                        value={option.label}
                                                        checked={isSelected}
                                                        onChange={() => handleSelectAnswer(option.label)}
                                                        disabled={showFeedback}
                                                        className="w-4 h-4 mt-1"
                                                    />
                                                    <span className="font-semibold text-gray-700 min-w-6">{option.label}.</span>
                                                    <span className="text-gray-700 flex-1">{option.text}</span>
                                                    {showFeedback && isCorrectOption && (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                    )}
                                                    {showFeedback && isSelected && !isCorrectOption && (
                                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                    )}
                                                </label>
                                            )
                                        })}
                                    </div>

                                    {/* Feedback / Explanation */}
                                    {showFeedback && (
                                        <div className={`p-4 rounded-lg mb-6 ${isAnswerCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {isAnswerCorrect ? (
                                                    <>
                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                        <span className="font-semibold text-green-700">Correct!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                        <span className="font-semibold text-red-700">Incorrect</span>
                                                        <span className="text-red-600">- Correct answer: {currentQuestion.correct_answer}</span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-gray-700 text-sm">{currentQuestion.explanation}</p>
                                        </div>
                                    )}

                                    {/* Submit Answer Button */}
                                    {selectedAnswer && !showFeedback && (
                                        <div className="flex justify-center mb-4">
                                            <button
                                                onClick={handleSubmitAnswer}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
                                            >
                                                Submit Answer
                                            </button>
                                        </div>
                                    )}

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={handlePreviousQuestion}
                                            disabled={currentQuestionIndex === 0}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentQuestionIndex === 0
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>

                                        {showFeedback && currentQuestionIndex < (currentArea.questions?.length || 0) - 1 && (
                                            <button
                                                onClick={handleNextQuestion}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                                            >
                                                Next Question
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}

                                        {!showFeedback && (
                                            <button
                                                onClick={handleNextQuestion}
                                                disabled={currentQuestionIndex >= (currentArea.questions?.length || 0) - 1}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentQuestionIndex >= (currentArea.questions?.length || 0) - 1
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                Skip / Next
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Question Navigation Dots */}
                            <div className="bg-white rounded-xl shadow p-4 max-w-4xl mx-auto">
                                <div className="flex gap-2 flex-wrap justify-center max-h-40 overflow-y-auto">
                                    {currentArea.questions?.map((_, i) => {
                                        const key = `${selectedAreaIndex}-${i}`
                                        const answered = answeredQuestions[key]

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleGoToQuestion(i)}
                                                className={`w-8 h-8 rounded-full text-sm font-medium transition ${currentQuestionIndex === i
                                                    ? 'bg-green-600 text-white ring-2 ring-green-300'
                                                    : answered
                                                        ? answered.isCorrect
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Topics View - Show topics for selected course
    if (viewMode === 'topics' && courseSlug) {
        const course = courses.find(c => c.slug === courseSlug)

        return (
            <DashboardLayout>
                {/* Header */}
                <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
                    <div className="text-center max-w-5xl mx-auto relative flex flex-col md:block items-center">
                        <button
                            onClick={() => navigate('/practice-questions')}
                            className="self-start md:self-auto md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-2 md:mb-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{course?.name || 'Topics'}</h1>
                            <p className="text-sm text-gray-500 mt-1">Select a topic to practice</p>
                        </div>
                    </div>
                </div>

                {/* Topics Grid */}
                <div className="p-4 md:p-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {course?.topics.map((topic) => (
                            <Link
                                key={topic.slug}
                                to={`/practice-questions/${courseSlug}/${topic.slug}`}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-md transition group text-left"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition">
                                        {topic.name}
                                    </h3>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    {topic.question_count} questions
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Courses View - Show all courses
    return (
        <DashboardLayout>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
                <div className="text-center max-w-5xl mx-auto relative flex flex-col md:block items-center">
                    <Link
                        to="/practice"
                        className="self-start md:self-auto md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-2 md:mb-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Practice Questions</h1>
                        <p className="text-sm text-gray-500 mt-1">Select a course to start practicing</p>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {courses.map((course) => (
                        <Link
                            key={course.slug}
                            to={`/practice-questions/${course.slug}`}
                            className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-2xl border border-green-200 p-8 hover:shadow-lg transition group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-700 transition">
                                        {course.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {course.topic_count} courses • {course.question_count} questions
                                    </p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition mt-2" />
                            </div>

                            {/* Topic preview */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {course.topics.slice(0, 4).map((topic) => (
                                    <span
                                        key={topic.slug}
                                        className="px-3 py-1 bg-white/60 text-gray-700 text-sm rounded-full"
                                    >
                                        {topic.name}
                                    </span>
                                ))}
                                {course.topics.length > 4 && (
                                    <span className="px-3 py-1 text-gray-500 text-sm">
                                        +{course.topics.length - 4} more
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
