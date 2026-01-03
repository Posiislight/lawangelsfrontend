import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Book, Video, HelpCircle, FileQuestion, X, Loader2 } from 'lucide-react'

interface SearchResult {
    id: string | number
    title: string
    type: 'course' | 'textbook' | 'video' | 'quiz'
    category?: string
    href: string
}

const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000/api'
    }
    return 'https://quiz-backend.onrender.com/api'
}

const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('authToken')
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

interface GlobalSearchProps {
    placeholder?: string
    className?: string
}

export default function GlobalSearch({
    placeholder = "Search courses, topics...",
    className = "w-80"
}: GlobalSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Search when query changes
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setIsOpen(false)
            return
        }

        const searchTimer = setTimeout(async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`${getApiBaseUrl()}/search/?q=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: getAuthHeaders(),
                })

                if (response.ok) {
                    const data = await response.json()
                    setResults(data.results || [])
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Search error:', error)
                // Fallback: local filtering of common pages
                const localResults: SearchResult[] = []
                const q = query.toLowerCase()

                // Add matching pages
                const pages = [
                    { title: 'Video Tutorials', href: '/video-tutorials', type: 'video' as const },
                    { title: 'Practice Questions', href: '/practice', type: 'quiz' as const },
                    { title: 'Mock Questions', href: '/mock-questions', type: 'quiz' as const },
                    { title: 'Textbooks', href: '/textbook', type: 'textbook' as const },
                    { title: 'Flashcards', href: '/flashcards', type: 'course' as const },
                    { title: 'My Courses', href: '/my-courses', type: 'course' as const },
                    { title: 'Progress', href: '/progress', type: 'course' as const },
                    { title: 'Angel AI', href: '/angel-ai', type: 'course' as const },
                    { title: 'Contract Law', href: '/my-courses', type: 'course' as const },
                    { title: 'Criminal Law', href: '/my-courses', type: 'course' as const },
                    { title: 'Land Law', href: '/my-courses', type: 'course' as const },
                    { title: 'Trusts', href: '/my-courses', type: 'course' as const },
                    { title: 'Taxation', href: '/my-courses', type: 'course' as const },
                ]

                pages.forEach((page, idx) => {
                    if (page.title.toLowerCase().includes(q)) {
                        localResults.push({ id: idx, ...page })
                    }
                })

                setResults(localResults.slice(0, 6))
                setIsOpen(localResults.length > 0)
            } finally {
                setIsLoading(false)
            }
        }, 300) // Debounce 300ms

        return () => clearTimeout(searchTimer)
    }, [query])

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false)
        setQuery('')
        navigate(result.href)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'textbook': return <Book className="w-4 h-4 text-blue-600" />
            case 'video': return <Video className="w-4 h-4 text-purple-600" />
            case 'quiz': return <FileQuestion className="w-4 h-4 text-green-600" />
            default: return <HelpCircle className="w-4 h-4 text-gray-600" />
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setIsOpen(true)}
                className="w-full px-4 py-2 pl-10 pr-8 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            {query && (
                <button
                    onClick={() => {
                        setQuery('')
                        setResults([])
                        setIsOpen(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <X className="w-4 h-4" />
                    )}
                </button>
            )}

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    {results.map((result) => (
                        <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                                {result.category && (
                                    <p className="text-xs text-gray-500">{result.category}</p>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query && results.length === 0 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <p className="text-sm text-gray-500 text-center">No results found for "{query}"</p>
                </div>
            )}
        </div>
    )
}
