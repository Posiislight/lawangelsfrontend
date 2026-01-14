import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  BookOpen, Bell, ArrowRight, Loader2, Filter
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { textbookApi } from '../services/textbookApi'
import type { TextbookListItem, TextbookCategory } from '../services/textbookApi'

// Category colors - FLK2 uses orange, BOTH uses brand dark (#0F172B)
const CATEGORY_STYLES = {
  FLK1: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    accent: 'bg-blue-500',
    border: 'border-t-blue-500',
  },
  FLK2: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    accent: 'bg-orange-500',
    border: 'border-t-orange-500',
  },
  BOTH: {
    badge: 'bg-slate-900 text-white border-slate-800',
    accent: 'bg-slate-900',
    border: 'border-t-slate-900',
  },
}

export default function Textbook() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [textbooks, setTextbooks] = useState<TextbookListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<TextbookCategory | 'ALL'>('ALL' as TextbookCategory | 'ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchTextbooks = async () => {
      try {
        setLoading(true)
        const data = await textbookApi.getTextbooks()
        setTextbooks(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching textbooks:', err)
        setError(err instanceof Error ? err.message : 'Failed to load textbooks')
      } finally {
        setLoading(false)
      }
    }

    fetchTextbooks()
  }, [])

  // Filter textbooks by category and search
  const filteredTextbooks = textbooks.filter(book => {
    const matchesCategory = selectedCategory === 'ALL' ||
      book.category === selectedCategory ||
      book.category === 'BOTH'
    const matchesSearch = searchQuery === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleOpenTextbook = (id: number) => {
    navigate(`/textbook/${id}`)
  }

  return (
    <DashboardLayout>
      <div className="font-worksans min-h-0 flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div>
              <h1 className="text-xl md:text-2xl font-normal text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                Textbook Library
              </h1>
              <p className="text-gray-600 text-sm mt-1">Comprehensive study materials for SQE preparation</p>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search textbooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Desktop Profile/Bell */}
            <div className="hidden md:flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {/* Category Filter Tabs */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Filter by:</span>
            </div>
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All Textbooks
              </button>
              <button
                onClick={() => setSelectedCategory('FLK1')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === 'FLK1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
              >
                FLK1
              </button>
              <button
                onClick={() => setSelectedCategory('FLK2')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === 'FLK2'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
              >
                FLK2
              </button>
            </div>
          </div>

          {loading ? (
            <>
              {/* Textbook cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-xl border-t-4 border-t-gray-300 overflow-hidden bg-white border border-gray-200">
                    <div className="p-6">
                      {/* Icon and category */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded-xl"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      {/* Title and subject */}
                      <div className="mb-4">
                        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-2"></div>
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      {/* Button */}
                      <div className="h-10 w-full bg-gray-300 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm">Loading textbooks...</span>
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
            </>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Textbooks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredTextbooks.map((textbook) => {
                  const categoryStyle = CATEGORY_STYLES[textbook.category]

                  return (
                    <div
                      key={textbook.id}
                      onClick={() => handleOpenTextbook(textbook.id)}
                      className={`rounded-xl border-t-4 ${categoryStyle.border} overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer group`}
                    >
                      <div className="p-6">
                        {/* Icon and Category */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-gray-500" />
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${categoryStyle.badge}`}>
                            {textbook.category}
                          </span>
                        </div>

                        {/* Title and Subject */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            {textbook.subject}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {textbook.title}
                          </h3>
                        </div>

                        {/* Action Button */}
                        <button
                          className={`w-full ${categoryStyle.accent} text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all group-hover:gap-3`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Open Textbook
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredTextbooks.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No textbooks found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout >
  )
}
