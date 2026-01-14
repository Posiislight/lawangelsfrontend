import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ChevronLeft, ChevronRight, Maximize2, Minimize2, Loader2, ArrowLeft, BookOpen, List,
    Play, Pause, Square, Volume2
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { textbookApi } from '../services/textbookApi'
import type { Textbook } from '../services/textbookApi'
import { useAudioReader } from '../hooks/useAudioReader'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Category styles - FLK2 uses orange, BOTH uses brand dark color
const CATEGORY_STYLES = {
    FLK1: 'bg-blue-100 text-blue-700',
    FLK2: 'bg-orange-100 text-orange-700',
    BOTH: 'bg-slate-900 text-white',
}

export default function TextbookReader() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [textbook, setTextbook] = useState<Textbook | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [pdfLoading, setPdfLoading] = useState(true)
    const [pageLoading, setPageLoading] = useState(false)
    const [showAudioSettings, setShowAudioSettings] = useState(false)
    const [pageText, setPageText] = useState<string>('')

    // Audio reader hook
    const audioReader = useAudioReader()

    // PDF URL with auth token
    const [pdfUrl, setPdfUrl] = useState<string>('')

    // Memoize PDF options to prevent unnecessary reloads
    const pdfOptions = useMemo(() => ({
        httpHeaders: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        withCredentials: true,
    }), [])

    useEffect(() => {
        const fetchTextbook = async () => {
            if (!id) return

            try {
                setLoading(true)
                const data = await textbookApi.getTextbook(parseInt(id))
                setTextbook(data)
                // Construct PDF URL
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                setPdfUrl(`${baseUrl}/textbooks/${id}/pdf/`)

                setError(null)
            } catch (err) {
                console.error('Error fetching textbook:', err)
                setError(err instanceof Error ? err.message : 'Failed to load textbook')
            } finally {
                setLoading(false)
            }
        }

        fetchTextbook()
    }, [id])

    // Exit fullscreen when leaving the page
    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {
                    // Ignore errors if already exited
                })
            }
        }
    }, [])

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
        setPdfLoading(false)
    }, [])

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('PDF load error:', error)
        setError('Failed to load PDF. Please try again.')
        setPdfLoading(false)
    }, [])

    const onPageLoadStart = useCallback(() => {
        setPageLoading(true)
    }, [])

    const onPageLoadSuccess = useCallback(async (page: any) => {
        setPageLoading(false)
        // Extract text from the page for audio reader
        try {
            const textContent = await page.getTextContent()
            const text = textContent.items.map((item: any) => item.str).join(' ')
            setPageText(text)
        } catch (err) {
            console.error('Error extracting text:', err)
            setPageText('')
        }
    }, [])

    // Handle audio playback
    const handlePlayPause = () => {
        if (audioReader.isPlaying) {
            audioReader.pause()
        } else if (audioReader.isPaused) {
            audioReader.resume()
        } else {
            if (pageText) {
                audioReader.speak(pageText)
            }
        }
    }

    const goToPreviousPage = () => {
        if (pageNumber > 1) {
            setPageLoading(true)
            setPageNumber(prev => prev - 1)
        }
    }

    const goToNextPage = () => {
        if (pageNumber < numPages) {
            setPageLoading(true)
            setPageNumber(prev => prev + 1)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        if (!isNaN(value) && value >= 1 && value <= numPages) {
            setPageLoading(true)
            setPageNumber(value)
        }
    }



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-gray-600">Loading textbook...</p>
                </div>
            </div>
        )
    }

    if (error || !textbook) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <BookOpen className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Textbook not found'}</p>
                    <button
                        onClick={() => navigate('/textbook')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-worksans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/textbook')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded-lg transition-colors ${showSidebar ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>

                    <div className="border-l border-gray-200 pl-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-gray-500" />
                            <div>
                                <h1 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                    {textbook.title}
                                </h1>
                                <p className="text-xs text-gray-500">
                                    {textbook.subject}
                                </p>
                            </div>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${CATEGORY_STYLES[textbook.category]}`}>
                                {textbook.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPreviousPage}
                        disabled={pageNumber <= 1 || pageLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2">
                        {pageLoading ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <>
                                <input
                                    type="number"
                                    min={1}
                                    max={numPages}
                                    value={pageNumber}
                                    onChange={handlePageInputChange}
                                    className="w-14 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-500">/ {numPages}</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages || pageLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    {/* Play/Pause Button */}
                    <button
                        onClick={handlePlayPause}
                        disabled={!pageText || pageLoading}
                        className={`p-2 rounded-lg transition-colors ${audioReader.isPlaying || audioReader.isPaused
                            ? 'bg-blue-100 text-blue-600'
                            : 'hover:bg-gray-100 text-gray-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={audioReader.isPlaying ? 'Pause' : audioReader.isPaused ? 'Resume' : 'Read Aloud'}
                    >
                        {audioReader.isPlaying ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </button>

                    {/* Stop Button */}
                    {(audioReader.isPlaying || audioReader.isPaused) && (
                        <button
                            onClick={audioReader.stop}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                            title="Stop"
                        >
                            <Square className="w-5 h-5" />
                        </button>
                    )}

                    {/* Speed Control */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAudioSettings(!showAudioSettings)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${showAudioSettings ? 'bg-gray-100' : 'hover:bg-gray-100'
                                } text-gray-600`}
                            title="Audio Settings"
                        >
                            <Volume2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Audio Options</span>
                        </button>

                        {/* Audio Settings Dropdown */}
                        {showAudioSettings && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Speed: {audioReader.rate}x
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.25"
                                        value={audioReader.rate}
                                        onChange={(e) => audioReader.setRate(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>0.5x</span>
                                        <span>1x</span>
                                        <span>2x</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Voice
                                    </label>
                                    <select
                                        value={audioReader.selectedVoice?.name || ''}
                                        onChange={(e) => {
                                            const voice = audioReader.voices.find(v => v.name === e.target.value)
                                            if (voice) audioReader.setVoice(voice)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {audioReader.voices.map((voice) => (
                                            <option key={voice.name} value={voice.name}>
                                                {voice.name} ({voice.lang})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fullscreen Toggle */}
                <div className="flex items-center border-l border-gray-200 pl-4">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-5 h-5 text-gray-600" />
                        ) : (
                            <Maximize2 className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Table of Contents */}
                {showSidebar && (
                    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Table of Contents
                            </h3>
                        </div>
                        <div className="p-2">
                            {/* Display actual chapters from the textbook */}
                            {textbook.chapters && textbook.chapters.length > 0 ? (
                                textbook.chapters.map((chapter, index) => {
                                    const nextChapter = textbook.chapters[index + 1]
                                    const isCurrentChapter = nextChapter
                                        ? pageNumber >= chapter.page && pageNumber < nextChapter.page
                                        : pageNumber >= chapter.page

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setPageLoading(true)
                                                setPageNumber(chapter.page)
                                            }}
                                            className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-colors flex items-start gap-3 mb-1 ${isCurrentChapter
                                                ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500'
                                                : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${isCurrentChapter ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium leading-tight">{chapter.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Page {chapter.page}</p>
                                            </div>
                                        </button>
                                    )
                                })
                            ) : (
                                <p className="text-sm text-gray-500 px-3 py-2">No chapters available</p>
                            )}
                        </div>


                        {/* Quick page nav - Chapter pages */}
                        {textbook.chapters && textbook.chapters.length > 0 && (
                            <div className="p-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Jump to Chapter
                                </p>
                                <div className="grid grid-cols-4 gap-1">
                                    {textbook.chapters.map((chapter, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setPageLoading(true)
                                                setPageNumber(chapter.page)
                                            }}
                                            className={`p-1.5 rounded text-xs font-medium transition-colors ${pageNumber === chapter.page
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            title={chapter.title}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                )}

                {/* PDF Viewer */}
                <main className="flex-1 bg-gray-200 flex justify-center items-start p-2 relative" style={{ height: 'calc(100vh - 60px)', overflow: 'auto' }}>
                    {(pdfLoading || pageLoading) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 z-10">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                <p className="text-gray-600">{pdfLoading ? 'Loading PDF...' : 'Loading page...'}</p>
                            </div>
                        </div>
                    )}

                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={null}
                        options={pdfOptions}
                        className="flex justify-center"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={0.85}
                            className="shadow-xl"
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onLoadStart={onPageLoadStart}
                            onLoadSuccess={onPageLoadSuccess}
                        />
                    </Document>
                </main>
            </div>
        </div>
    )
}
