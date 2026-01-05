import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lightbulb, Eye, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { flashcardsApi, type Flashcard, type FlashcardProgress } from '../services/flashcardsApi'
import DashboardLayout from '../components/DashboardLayout'

export default function FlashcardStudy() {
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()

    const [deckTitle, setDeckTitle] = useState('')
    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [progress, setProgress] = useState<FlashcardProgress | null>(null)
    const [loading, setLoading] = useState(true)
    const [correctCards, setCorrectCards] = useState<boolean[]>([])

    useEffect(() => {
        loadStudySession()
    }, [deckId])

    const loadStudySession = async () => {
        try {
            setLoading(true)
            const data = await flashcardsApi.getStudySession(Number(deckId))
            setDeckTitle(data.deck.title)
            setCards(data.cards)
            setProgress(data.progress)
            setCorrectCards(new Array(data.cards.length).fill(false))
        } catch (error) {
            console.error('Error loading study session:', error)
        } finally {
            setLoading(false)
        }
    }

    const currentCard = cards[currentIndex]

    const handleShowAnswer = () => {
        setShowAnswer(true)
    }

    const handleNext = async (isCorrect?: boolean) => {
        // Update progress
        if (showAnswer && typeof isCorrect === 'boolean') {
            const updatedCorrectCards = [...correctCards]
            updatedCorrectCards[currentIndex] = isCorrect
            setCorrectCards(updatedCorrectCards)

            try {
                const updatedProgress = await flashcardsApi.updateProgress(
                    Number(deckId),
                    currentIndex + 1,
                    isCorrect
                )
                setProgress(updatedProgress)
            } catch (error) {
                console.error('Error updating progress:', error)
            }
        }

        // Move to next card
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setShowAnswer(false)
            setShowHint(false)
        }
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setShowAnswer(false)
            setShowHint(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-xl">Loading flashcards...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (cards.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-xl">No flashcards found in this deck.</div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
                {/* Back button */}
                <div className="w-full max-w-4xl mb-4">
                    <button
                        onClick={() => navigate('/flashcards')}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Flashcards
                    </button>
                </div>

                <div className="w-full max-w-4xl flex flex-col gap-8">
                    {/* Progress bar */}
                    <div className="flex gap-2 w-full">
                        {cards.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${index < currentIndex
                                    ? correctCards[index]
                                        ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                        : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                    : index === currentIndex
                                        ? 'bg-blue-600 shadow-[0_0_10px_rgba(10,88,202,0.3)]'
                                        : 'bg-blue-100 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Flashcard - Click to flip */}
                    <div
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="relative w-full min-h-[400px] bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl flex flex-col justify-between p-8 shadow-xl border border-white/50 dark:border-white/10 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 cursor-pointer hover:shadow-2xl"
                    >
                        {/* Top indicator */}
                        <div className="w-full flex justify-between items-start z-10">
                            <div />
                            <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full ${showAnswer
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {showAnswer ? 'Answer' : 'Question'}
                            </span>
                        </div>

                        {/* Card content */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full text-center z-10">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-slate-800 dark:text-white tracking-tight leading-relaxed max-w-3xl drop-shadow-sm overflow-y-auto max-h-[280px]">
                                {showAnswer ? currentCard?.answer : currentCard?.question}
                            </h1>
                        </div>

                        {/* Tap to flip hint */}
                        <div className="w-full flex justify-center z-10">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                👆 Tap to {showAnswer ? 'see question' : 'reveal answer'}
                            </span>
                        </div>

                        {/* Bottom control */}
                        <div className="w-full flex justify-end z-10">
                            <button
                                className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-white/10 p-2.5 rounded-full transition-all duration-200"
                                title="Expand view"
                            >
                                <Maximize2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Decorative gradients */}
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-500 ${showAnswer && correctCards[currentIndex]
                            ? 'bg-green-200/20 dark:bg-green-500/10'
                            : showAnswer
                                ? 'bg-red-200/20 dark:bg-red-500/10'
                                : 'bg-blue-200/20 dark:bg-blue-500/10'
                            }`} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    </div>

                    {/* Navigation controls */}
                    <div className="flex items-center justify-center gap-8 mt-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="group p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className={`w-5 h-5 group-active:-translate-x-0.5 transition-transform ${currentIndex === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }`} />
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                {currentIndex + 1} / {cards.length}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Cards</span>
                        </div>

                        <button
                            onClick={() => handleNext()}
                            disabled={currentIndex === cards.length - 1}
                            className="group p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className={`w-5 h-5 group-active:translate-x-0.5 transition-transform ${currentIndex === cards.length - 1 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-300'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </DashboardLayout>
    )
}
