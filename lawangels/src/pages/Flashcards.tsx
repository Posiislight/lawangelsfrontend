import { useAuth } from '../contexts/AuthContext'
import { ChevronRight, RotateCw, Scale, Gavel, Home, FileText, Building, Users } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { flashcardsApi, type FlashcardTopic } from '../services/flashcardsApi'

// Map subject names to icons
const subjectIcons: Record<string, React.ReactNode> = {
  'Criminal Law': <Gavel className="w-10 h-10" />,
  'Criminal Practice': <Scale className="w-10 h-10" />,
  'Land Law': <Home className="w-10 h-10" />,
  'Property Practice': <Building className="w-10 h-10" />,
  'Wills & Administration': <FileText className="w-10 h-10" />,
  'Trusts': <Users className="w-10 h-10" />,
}

export default function Flashcards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<FlashcardTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      setLoading(true)
      const data = await flashcardsApi.getTopics()
      setTopics(data)
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColorForCategory = (category: string) => {
    const colors = {
      'FLK1': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
      'FLK2': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
    }
    return colors[category as keyof typeof colors] || colors['FLK1']
  }

  const getIconForSubject = (subject: string) => {
    return subjectIcons[subject] || <Scale className="w-10 h-10" />
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal text-black">Flashcards</h1>
            <p className="text-gray-600 text-sm mt-1">Select a topic to study</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-8">
        <h2 className="text-2xl font-normal text-black mb-1">Choose a Topic</h2>
        <p className="text-gray-600 text-sm mb-6">Each topic contains multiple chapters with flashcards</p>

        {loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                  {/* Header skeleton */}
                  <div className="bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer bg-[length:200%_100%] p-6">
                    <div className="w-10 h-10 bg-white/30 rounded-lg mb-3 animate-pulse"></div>
                    <div className="h-6 w-32 bg-white/30 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  </div>
                  {/* Content skeleton */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="text-center">
                        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading flashcards...</span>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => {
              const color = getColorForCategory(topic.category)

              return (
                <div
                  key={topic.subject}
                  onClick={() => navigate(`/flashcards/topic/${encodeURIComponent(topic.subject)}`)}
                  className="rounded-xl overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-xl cursor-pointer group"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${color.gradient} p-6 text-white`}>
                    <div className="mb-3">{getIconForSubject(topic.subject)}</div>
                    <h3 className="text-xl font-semibold">{topic.subject}</h3>
                    <p className="text-white/80 text-sm mt-1">{topic.category}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{topic.totalDecks}</p>
                          <p className="text-xs text-gray-500">Chapters</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{topic.totalCards}</p>
                          <p className="text-xs text-gray-500">Cards</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>

                    <button className={`w-full ${color.accent} text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      View Chapters
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
