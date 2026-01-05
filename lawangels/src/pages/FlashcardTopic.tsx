import { useAuth } from '../contexts/AuthContext'
import { ChevronRight, RotateCw, ArrowLeft } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { flashcardsApi, type FlashcardDeck } from '../services/flashcardsApi'

export default function FlashcardTopic() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { subject } = useParams<{ subject: string }>()
    const [chapters, setChapters] = useState<FlashcardDeck[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (subject) {
            loadChapters()
        }
    }, [subject])

    const loadChapters = async () => {
        try {
            setLoading(true)
            const decks = await flashcardsApi.getDecksBySubject(decodeURIComponent(subject!))
            setChapters(decks)
        } catch (error) {
            console.error('Error loading chapters:', error)
        } finally {
            setLoading(false)
        }
    }

    const getColorForCategory = (category: string) => {
        const colors = {
            'FLK1': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
            'FLK2': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
        }
        return colors[category as keyof typeof colors] || colors['FLK1']
    }

    const decodedSubject = subject ? decodeURIComponent(subject) : 'Flashcards'
    const category = chapters[0]?.category || 'FLK1'
    const color = getColorForCategory(category)

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/flashcards')}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-normal text-black">{decodedSubject}</h1>
                        <p className="text-gray-600 text-sm mt-1">Select a chapter to study</p>
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="p-8">
                {loading ? (
                    <div className="text-center py-12">Loading chapters...</div>
                ) : chapters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No chapters found for this topic</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                onClick={() => navigate(`/flashcards/${chapter.id}/study`)}
                                className={`rounded-xl border-l-4 ${color.border} overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer group`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {chapter.title}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                        <span>{chapter.total_cards} flashcards</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                                            {chapter.category}
                                        </span>
                                    </div>

                                    {chapter.user_progress && chapter.user_progress.cards_studied > 0 && (
                                        <div className="mb-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${color.accent}`}
                                                    style={{ width: `${chapter.user_progress.progress_percentage}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>{chapter.user_progress.progress_percentage}% complete</span>
                                                <span>{chapter.user_progress.accuracy_percentage}% accuracy</span>
                                            </div>
                                        </div>
                                    )}

                                    <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                                        {chapter.user_progress && chapter.user_progress.cards_studied > 0 ? 'Continue' : 'Start'}
                                        <RotateCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
