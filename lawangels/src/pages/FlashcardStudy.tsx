import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, X, HelpCircle, Check } from 'lucide-react'
import { flashcardsApi, type Flashcard } from '../services/flashcardsApi'
import DashboardLayout from '../components/DashboardLayout'

export default function FlashcardStudy() {
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()

    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)
    const [loading, setLoading] = useState(true)
    const [correctCards, setCorrectCards] = useState<boolean[]>([])
    const [deckTitle, setDeckTitle] = useState<string>('')

    useEffect(() => {
        loadStudySession()
    }, [deckId])

    const loadStudySession = async () => {
        try {
            setLoading(true)
            const data = await flashcardsApi.getStudySession(Number(deckId))
            setCards(data.cards)
            setCorrectCards(new Array(data.cards.length).fill(false))
            setDeckTitle(data.deck?.subject || data.deck?.title || 'Flashcards')
        } catch (error) {
            console.error('Error loading study session:', error)
        } finally {
            setLoading(false)
        }
    }

    const currentCard = cards[currentIndex]



    const handleNext = (isCorrect?: boolean) => {
        // Update local state immediately
        if (showAnswer && typeof isCorrect === 'boolean') {
            const updatedCorrectCards = [...correctCards]
            updatedCorrectCards[currentIndex] = isCorrect
            setCorrectCards(updatedCorrectCards)

            // Fire-and-forget API call (don't await)
            flashcardsApi.updateProgress(
                Number(deckId),
                currentIndex + 1,
                isCorrect
            ).catch(error => console.error('Error updating progress:', error))
        }

        // Move to next card immediately
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setShowAnswer(false)
        }
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setShowAnswer(false)
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
                        onClick={() => navigate(`/flashcards/topic/${encodeURIComponent(deckTitle)}`)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to {deckTitle} Flashcards
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



                        {/* Decorative gradients */}
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-500 ${showAnswer && correctCards[currentIndex]
                            ? 'bg-green-200/20 dark:bg-green-500/10'
                            : showAnswer
                                ? 'bg-red-200/20 dark:bg-red-500/10'
                                : 'bg-blue-200/20 dark:bg-blue-500/10'
                            }`} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    </div>

                    {/* Self-Assessment Buttons - Show only when answer is revealed */}
                    {showAnswer && (
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext(false);
                                }}
                                className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <X className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">I was incorrect</span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext(false);
                                }}
                                className="flex items-center gap-2 px-5 py-3 rounded-full bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-200 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HelpCircle className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">I was not sure</span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">I was correct</span>
                            </button>
                        </div>
                    )}

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
