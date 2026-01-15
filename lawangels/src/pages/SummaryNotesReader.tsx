import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { summaryNotesApi, type SummaryNotesDetail, type SummaryNotesChapterDetail } from '../services/summaryNotesApi'

// Brand colors
const PRIMARY_COLOR = '#0EA5E9'

export default function SummaryNotesReader() {
    const { id, chapterId } = useParams<{ id: string; chapterId?: string }>()

    const [notes, setNotes] = useState<SummaryNotesDetail | null>(null)
    const [chapter, setChapter] = useState<SummaryNotesChapterDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [chapterLoading, setChapterLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [completedChapters, setCompletedChapters] = useState<number[]>([])

    // Load summary notes and chapter in parallel when possible
    useEffect(() => {
        const loadData = async () => {
            if (!id) return
            try {
                setLoading(true)
                const notesId = parseInt(id)

                // If we have a chapter ID from URL, fetch BOTH in parallel
                if (chapterId) {
                    const [data, chapterData] = await Promise.all([
                        summaryNotesApi.get(notesId),
                        summaryNotesApi.getChapter(notesId, parseInt(chapterId))
                    ])

                    setNotes(data)
                    setChapter(chapterData)

                    // Get completed chapters from user progress
                    const completedIds = data.chapters
                        .filter(c => c.is_completed)
                        .map(c => c.id)
                    setCompletedChapters(completedIds)

                    // Fire-and-forget progress update (don't block UI)
                    summaryNotesApi.updateProgress(notesId, parseInt(chapterId), false).catch(console.error)
                } else {
                    // No chapter ID - fetch notes first, then determine chapter
                    const data = await summaryNotesApi.get(notesId)
                    setNotes(data)

                    // Get completed chapters from user progress
                    const completedIds = data.chapters
                        .filter(c => c.is_completed)
                        .map(c => c.id)
                    setCompletedChapters(completedIds)

                    // Load first chapter or current chapter
                    const targetChapterId = data.current_chapter_id || data.chapters[0]?.id
                    if (targetChapterId) {
                        await loadChapter(notesId, targetChapterId)
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load notes')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, chapterId])

    const loadChapter = useCallback(async (notesId: number, chapId: number) => {
        try {
            setChapterLoading(true)
            const chapterData = await summaryNotesApi.getChapter(notesId, chapId)
            setChapter(chapterData)

            // Fire-and-forget progress update (don't block UI)
            summaryNotesApi.updateProgress(notesId, chapId, false).catch(console.error)

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

    const [markingComplete, setMarkingComplete] = useState(false)

    const handleMarkComplete = async () => {
        if (!id || !chapter) return

        try {
            setMarkingComplete(true)
            const result = await summaryNotesApi.updateProgress(parseInt(id), chapter.id, true)
            console.log('Mark complete result:', result)
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
            alert('Failed to mark chapter as complete. Please try again.')
        } finally {
            setMarkingComplete(false)
        }
    }

    // Find previous and next chapter titles
    const currentIndex = notes?.chapters.findIndex(c => c.id === chapter?.id) ?? -1
    const prevChapter = currentIndex > 0 ? notes?.chapters[currentIndex - 1] : null
    const nextChapter = currentIndex >= 0 && currentIndex < (notes?.chapters.length ?? 0) - 1
        ? notes?.chapters[currentIndex + 1]
        : null

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-worksans">
                {/* Skeleton Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="text-center hidden md:block">
                            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    </div>
                </header>

                {/* Skeleton Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Skeleton Sidebar */}
                        <aside className="w-full lg:w-96 flex-shrink-0">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-6" />
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="p-4 rounded-xl bg-gray-100 animate-pulse">
                                            <div className="w-16 h-3 bg-gray-200 rounded mb-2" />
                                            <div className="w-40 h-4 bg-gray-200 rounded" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                            </div>
                        </aside>

                        {/* Skeleton Content Area */}
                        <div className="flex-1 flex flex-col space-y-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex justify-between">
                                    <div className="flex space-x-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                    </div>
                                    <div className="flex space-x-3">
                                        <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
                                        <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            <article className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm border border-gray-100">
                                <div className="w-64 h-7 bg-gray-200 rounded animate-pulse mb-6" />
                                <div className="space-y-4">
                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </article>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (error || !notes) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-red-500 mb-4">{error || 'Notes not found'}</p>
                <Link to="/summary-notes" className="text-blue-600 hover:underline">
                    Back to Summary Notes
                </Link>
            </div>
        )
    }

    const progressPercentage = notes.total_chapters > 0
        ? Math.round((completedChapters.length / notes.total_chapters) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-worksans">
            {/* Top Header - Sticky */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Back to Summary Notes */}
                    <Link
                        to="/summary-notes"
                        className="flex items-center gap-2 text-gray-500 hover:text-sky-500 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Summary Notes</span>
                    </Link>

                    {/* Center Title */}
                    <div className="text-center hidden md:block">
                        <h1 className="text-xl font-bold text-gray-900">Summary Notes</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {notes.title} • Chapter {chapter?.chapter_number || 1} of {notes.total_chapters}
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Progress</p>
                            <p className="text-sm font-bold text-gray-900">{progressPercentage}%</p>
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%`, backgroundColor: PRIMARY_COLOR }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-8 h-full">
                    {/* Left Sidebar - Chapters */}
                    <aside className="w-full lg:w-96 flex-shrink-0">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                            {/* Sidebar Header */}
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-gray-900">{notes.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Chapter {chapter?.chapter_number || 1} of {notes.total_chapters}
                                </p>
                            </div>

                            {/* Chapter List */}
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {notes.chapters.map((chap, idx) => {
                                    const isActive = chap.id === chapter?.id
                                    const isCompleted = completedChapters.includes(chap.id)

                                    if (isCompleted && !isActive) {
                                        // Completed chapter style
                                        return (
                                            <button
                                                key={chap.id}
                                                onClick={() => handleChapterClick(chap.id)}
                                                className="w-full p-4 rounded-xl bg-green-50 flex justify-between items-start cursor-pointer transition-colors hover:bg-green-100"
                                            >
                                                <div className="text-left">
                                                    <p className="text-xs font-medium text-green-700 mb-1">Chapter {idx + 1}</p>
                                                    <p className="text-sm font-medium text-green-900">{chap.title}</p>
                                                </div>
                                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            </button>
                                        )
                                    }

                                    if (isActive) {
                                        // Active chapter style
                                        return (
                                            <div
                                                key={chap.id}
                                                className="p-4 rounded-xl text-white shadow-md relative overflow-hidden"
                                                style={{ backgroundColor: PRIMARY_COLOR }}
                                            >
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-medium text-white/80 mb-1">Chapter {idx + 1}</p>
                                                        <p className="text-sm font-bold">{chap.title}</p>
                                                    </div>
                                                    {isCompleted && (
                                                        <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    }

                                    // Default chapter style
                                    return (
                                        <button
                                            key={chap.id}
                                            onClick={() => handleChapterClick(chap.id)}
                                            className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                                        >
                                            <p className="text-xs font-medium text-gray-500 mb-1">Chapter {idx + 1}</p>
                                            <p className="text-sm font-medium text-gray-900">{chap.title}</p>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Overall Progress */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-xs font-semibold text-gray-500">Overall Progress</p>
                                    <p className="text-sm font-bold text-gray-900">{progressPercentage}%</p>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercentage}%`, backgroundColor: PRIMARY_COLOR }}
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Content Area */}
                    <div className="flex-1 flex flex-col space-y-6 min-h-0">
                        {/* Content Toolbar */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-end items-center">
                            <div className="flex space-x-3">
                                <button
                                    onClick={handlePrevious}
                                    disabled={!chapter?.previous_chapter_id}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!chapter?.next_chapter_id}
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{ backgroundColor: PRIMARY_COLOR }}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>

                        {/* Chapter Content */}
                        <article className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm border border-gray-100 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                            {chapterLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY_COLOR }} />
                                </div>
                            ) : chapter ? (
                                <>
                                    <div className="max-w-3xl mx-auto">
                                        {/* Chapter Header */}
                                        <div className="text-center mb-12 pb-8 border-b border-gray-200">
                                            <p className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-2 font-sans">
                                                Chapter {chapter.chapter_number}
                                            </p>
                                            <h2 className="text-3xl font-extrabold text-black uppercase tracking-tight font-serif leading-tight">
                                                {chapter.title}
                                            </h2>
                                        </div>

                                        {/* Render HTML content with textbook styling */}
                                        <div
                                            className="prose prose-lg max-w-none font-serif text-black
                                                prose-headings:font-bold prose-headings:text-black prose-headings:font-serif
                                                prose-h1:text-2xl prose-h1:text-center prose-h1:uppercase prose-h1:mb-8
                                                prose-h2:text-xl prose-h2:uppercase prose-h2:tracking-wide prose-h2:mt-10 prose-h2:mb-4
                                                prose-h3:text-lg prose-h3:font-bold prose-h3:text-black prose-h3:mt-8 prose-h3:mb-3
                                                prose-p:leading-relaxed prose-p:mb-6 prose-p:text-justify
                                                prose-strong:font-bold prose-strong:text-black
                                                prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-2
                                                prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-4
                                                prose-li:marker:text-black prose-li:pl-1
                                                prose-blockquote:border-l-4 prose-blockquote:border-gray-900 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-800"
                                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                                        />
                                    </div>

                                    {/* Mark Complete Button */}
                                    {!completedChapters.includes(chapter.id) && (
                                        <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-100">
                                            <button
                                                onClick={handleMarkComplete}
                                                disabled={markingComplete}
                                                className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ backgroundColor: PRIMARY_COLOR }}
                                            >
                                                {markingComplete ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5" />
                                                )}
                                                {markingComplete ? 'Marking...' : 'Mark as Completed'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-20 text-gray-500">
                                    Select a chapter to start reading
                                </div>
                            )}
                        </article>

                        {/* Footer Navigation */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            {prevChapter ? (
                                <button
                                    onClick={handlePrevious}
                                    className="group text-left w-full sm:w-auto hover:bg-gray-50 p-4 -m-4 rounded-xl transition-colors"
                                >
                                    <p className="text-xs text-gray-500 mb-1">Previous Chapter</p>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
                                        Chapter {currentIndex}: {prevChapter.title}
                                    </p>
                                </button>
                            ) : (
                                <div />
                            )}

                            <div className="h-px w-full sm:w-px sm:h-10 bg-gray-200" />

                            {nextChapter ? (
                                <button
                                    onClick={handleNext}
                                    className="group text-right w-full sm:w-auto hover:bg-gray-50 p-4 -m-4 rounded-xl transition-colors"
                                >
                                    <p className="text-xs text-gray-500 mb-1">Next Chapter</p>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
                                        Chapter {currentIndex + 2}: {nextChapter.title}
                                    </p>
                                </button>
                            ) : (
                                <div />
                            )}
                        </div>
                    </div>
                </div>
            </main >

            {/* Bottom Spacer */}
            < div className="h-12" />
        </div >
    )
}
