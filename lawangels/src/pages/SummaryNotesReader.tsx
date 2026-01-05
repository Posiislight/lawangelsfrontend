import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, CheckCircle, Bookmark, Share2 } from 'lucide-react'
import { summaryNotesApi, type SummaryNotesDetail, type SummaryNotesChapterDetail } from '../services/summaryNotesApi'

// Brand colors
const TEAL_COLOR = '#0D9488'

export default function SummaryNotesReader() {
    const { id, chapterId } = useParams<{ id: string; chapterId?: string }>()

    const [notes, setNotes] = useState<SummaryNotesDetail | null>(null)
    const [chapter, setChapter] = useState<SummaryNotesChapterDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [chapterLoading, setChapterLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [completedChapters, setCompletedChapters] = useState<number[]>([])

    // Load summary notes
    useEffect(() => {
        const loadNotes = async () => {
            if (!id) return
            try {
                setLoading(true)
                const data = await summaryNotesApi.get(parseInt(id))
                setNotes(data)

                // Get completed chapters from user progress
                const completedIds = data.chapters
                    .filter(c => c.is_completed)
                    .map(c => c.id)
                setCompletedChapters(completedIds)

                // Load first chapter or current chapter
                const targetChapterId = chapterId
                    ? parseInt(chapterId)
                    : data.current_chapter_id || data.chapters[0]?.id

                if (targetChapterId) {
                    await loadChapter(parseInt(id), targetChapterId)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load notes')
            } finally {
                setLoading(false)
            }
        }
        loadNotes()
    }, [id])

    const loadChapter = useCallback(async (notesId: number, chapId: number) => {
        try {
            setChapterLoading(true)
            const chapterData = await summaryNotesApi.getChapter(notesId, chapId)
            setChapter(chapterData)

            // Update progress
            await summaryNotesApi.updateProgress(notesId, chapId, false)

            // Update URL without reload
            window.history.replaceState({}, '', `/summary-notes/${notesId}/chapter/${chapId}`)
        } catch (err) {
            console.error('Failed to load chapter:', err)
        } finally {
            setChapterLoading(false)
        }
    }, [])

    const handleChapterClick = (chapId: number) => {
        if (id && chapId !== chapter?.id) {
            loadChapter(parseInt(id), chapId)
        }
    }

    const handlePrevious = () => {
        if (chapter?.previous_chapter_id && id) {
            loadChapter(parseInt(id), chapter.previous_chapter_id)
        }
    }

    const handleNext = () => {
        if (chapter?.next_chapter_id && id) {
            loadChapter(parseInt(id), chapter.next_chapter_id)
        }
    }

    const handleMarkComplete = async () => {
        if (!id || !chapter) return

        try {
            const result = await summaryNotesApi.updateProgress(parseInt(id), chapter.id, true)
            setCompletedChapters(result.completed_chapters)

            // Update notes state
            if (notes) {
                setNotes({
                    ...notes,
                    chapters_completed: result.chapters_completed,
                    progress_percentage: result.progress_percentage,
                })
            }
        } catch (err) {
            console.error('Failed to mark complete:', err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
        )
    }

    if (error || !notes) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-red-500 mb-4">{error || 'Notes not found'}</p>
                <Link to="/summary-notes" className="text-blue-600 hover:underline">
                    Back to Study Notes
                </Link>
            </div>
        )
    }

    const progressPercentage = notes.total_chapters > 0
        ? Math.round((completedChapters.length / notes.total_chapters) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Dashboard
                    </Link>

                    <div className="text-center">
                        <h1 className="text-lg font-semibold text-gray-900">Study Notes</h1>
                        <p className="text-sm text-gray-500">
                            {notes.title} • Chapter {chapter?.chapter_number || 1} of {notes.total_chapters}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Progress</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%`, backgroundColor: TEAL_COLOR }}
                                />
                            </div>
                            <span className="text-sm font-medium" style={{ color: TEAL_COLOR }}>
                                {progressPercentage}%
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar - Chapters */}
                <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">{notes.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Chapter {chapter?.chapter_number || 1} of {notes.total_chapters}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {notes.chapters.map((chap, idx) => {
                            const isActive = chap.id === chapter?.id
                            const isCompleted = completedChapters.includes(chap.id)

                            return (
                                <button
                                    key={chap.id}
                                    onClick={() => handleChapterClick(chap.id)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors flex items-center gap-3 ${isActive
                                        ? 'bg-teal-50 border-l-4 border-l-teal-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isActive
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Chapter {idx + 1}</p>
                                        <p className={`text-sm truncate ${isActive ? 'font-medium text-teal-700' : 'text-gray-700'}`}>
                                            {chap.title}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Overall Progress */}
                    <div className="p-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%`, backgroundColor: TEAL_COLOR }}
                            />
                        </div>
                        <p className="text-sm text-gray-500">{progressPercentage}%</p>
                    </div>
                </aside>

                {/* Right Content Area */}
                <main className="flex-1 flex flex-col">
                    {/* Content Header */}
                    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bookmark className="w-5 h-5 text-gray-500" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Share2 className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevious}
                                disabled={!chapter?.previous_chapter_id}
                                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!chapter?.next_chapter_id}
                                className="flex items-center gap-1 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                style={{ backgroundColor: TEAL_COLOR }}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chapter Content */}
                    <div className="flex-1 overflow-y-auto">
                        {chapterLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                            </div>
                        ) : chapter ? (
                            <div className="max-w-3xl mx-auto px-8 py-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">{chapter.title}</h1>

                                {/* Render HTML content */}
                                <div
                                    className="prose prose-gray max-w-none
                    prose-headings:text-gray-900 
                    prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                    prose-li:text-gray-700 prose-li:my-1
                    prose-strong:text-gray-900
                    prose-em:text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                                />

                                {/* Mark Complete Button */}
                                {!completedChapters.includes(chapter.id) && (
                                    <div className="mt-12 pt-8 border-t border-gray-200">
                                        <button
                                            onClick={handleMarkComplete}
                                            className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: TEAL_COLOR }}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Mark as Completed
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-20 text-gray-500">
                                Select a chapter to start reading
                            </div>
                        )}
                    </div>

                    {/* Footer Navigation */}
                    <div className="bg-gray-100 border-t border-gray-200 px-8 py-4">
                        <div className="max-w-3xl mx-auto flex items-center justify-between">
                            <div>
                                {chapter?.previous_chapter_id && (
                                    <button
                                        onClick={handlePrevious}
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <span className="text-xs text-gray-500 block">Previous Chapter</span>
                                        <span className="font-medium">
                                            Chapter {(chapter.chapter_number || 1) - 1}
                                        </span>
                                    </button>
                                )}
                            </div>
                            <div className="text-right">
                                {chapter?.next_chapter_id && (
                                    <button
                                        onClick={handleNext}
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <span className="text-xs text-gray-500 block">Next Chapter</span>
                                        <span className="font-medium">
                                            Chapter {(chapter.chapter_number || 1) + 1}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
