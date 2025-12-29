import { useAuth } from '../contexts/AuthContext'
import { Bell, ChevronRight, Zap, Award, Grid, Clock, RotateCw } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

export default function Flashcards() {
  const { user } = useAuth()

  const flashcardDecks = [
    {
      title: 'Constitutional Law Key Terms',
      course: 'Constitutional Law',
      totalCards: 85,
      studiedCards: 67,
      progress: 79,
      accuracy: 82,
      lastReviewed: '2 hours ago',
      topics: ['Sovereignty', 'Rule of Law', 'Separation of Powers', 'Judicial Review'],
      color: 'blue',
    },
    {
      title: 'Contract Law Definitions',
      course: 'Contract Law',
      totalCards: 120,
      studiedCards: 54,
      progress: 45,
      accuracy: 76,
      lastReviewed: '1 day ago',
      topics: ['Formation', 'Consideration', 'Terms', 'Breach', 'Remedies'],
      color: 'purple',
    },
    {
      title: 'Property Law Concepts',
      course: 'Property Law',
      totalCards: 95,
      studiedCards: 85,
      progress: 89,
      accuracy: 88,
      lastReviewed: '3 hours ago',
      topics: ['Registration', 'Leasehold', 'Co-ownership', 'Mortgages', 'Easements'],
      color: 'green',
    },
    {
      title: 'Criminal Law Principles',
      course: 'Criminal Law',
      totalCards: 110,
      studiedCards: 35,
      progress: 32,
      accuracy: 68,
      lastReviewed: '5 days ago',
      topics: ['Actus Reus', 'Mens Rea', 'Defences', 'Homicide', 'Theft'],
      color: 'red',
    },
    {
      title: 'Tort Law Essentials',
      course: 'Tort Law',
      totalCards: 100,
      studiedCards: 0,
      progress: 0,
      accuracy: 0,
      lastReviewed: 'Never',
      topics: ['Negligence', 'Defamation', 'Trespass', 'Nuisance', 'Liability'],
      color: 'yellow',
    },
    {
      title: 'Equity and Trusts Terms',
      course: 'Equity and Trusts',
      totalCards: 90,
      studiedCards: 0,
      progress: 0,
      accuracy: 0,
      lastReviewed: 'Never',
      topics: ['Trust Creation', 'Beneficiaries', 'Breach', 'Remedies', 'Equitable'],
      color: 'indigo',
    },
  ]

  const recentlyStudied = [
    {
      title: 'Parliamentary Sovereignty',
      course: 'Constitutional Law',
      cardsLearned: 12,
      totalCards: 15,
      accuracy: 85,
      studiedAt: '2 hours ago',
      color: 'blue',
    },
    {
      title: 'Formation of Contracts',
      course: 'Contract Law',
      cardsLearned: 8,
      totalCards: 12,
      accuracy: 75,
      studiedAt: '1 day ago',
      color: 'purple',
    },
    {
      title: 'Land Registration',
      course: 'Property Law',
      cardsLearned: 15,
      totalCards: 15,
      accuracy: 92,
      studiedAt: '3 hours ago',
      color: 'green',
    },
  ]

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              🎓 Flashcards
            </h1>
            <p className="text-gray-600">Master key concepts with spaced repetition learning</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search flashcard decks..."
                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
      <div className="p-8">
        {/* Recently Studied Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-normal text-black mb-1">Recently Studied</h2>
          <p className="text-gray-600 text-sm mb-6">Continue your spaced repetition review</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {recentlyStudied.map((set, idx) => {
              const color = colorMap[set.color as keyof typeof colorMap]

              return (
                <div key={idx} className={`rounded-lg p-6 border border-gray-200 ${color.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className={`font-semibold ${color.text} text-sm uppercase tracking-wide`}>Flashcard Set</h3>
                    <ChevronRight className={`w-5 h-5 ${color.text}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{set.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{set.course}</p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {set.cardsLearned}/{set.totalCards}
                      </span>
                      <span className="text-sm font-semibold text-gray-600">Accuracy: {set.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.accent}`}
                        style={{ width: `${(set.cardsLearned / set.totalCards) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">Studied {set.studiedAt}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Flashcard Decks Section */}
        <div>
          <h2 className="text-2xl font-normal text-black mb-1">All Flashcard Decks</h2>
          <p className="text-gray-600 text-sm mb-6">Browse through flashcard sets organized by course</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcardDecks.map((deck, idx) => {
              const color = colorMap[deck.color as keyof typeof colorMap]

              return (
                <div
                  key={idx}
                  className="rounded-xl border-t-4 border-t-blue-500 overflow-hidden transition-all bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${color.text} mb-2`}>
                          {deck.course}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{deck.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cards</span>
                        <span className="font-semibold text-gray-900">
                          {deck.studiedCards}/{deck.totalCards}
                        </span>
                      </div>

                      {deck.studiedCards > 0 && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${color.accent}`}
                              style={{ width: `${deck.progress}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Progress</p>
                              <p className="text-lg font-semibold text-gray-900">{deck.progress}%</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                              <p className="text-lg font-semibold text-gray-900">{deck.accuracy}%</p>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Reviewed</span>
                        <span className="font-semibold text-gray-900">{deck.lastReviewed}</span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Key Concepts</p>
                      <div className="flex flex-wrap gap-2">
                        {deck.topics.map((topic, tidx) => (
                          <span
                            key={tidx}
                            className={`text-xs px-3 py-1 rounded-full ${color.bg} ${color.text} font-medium`}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className={`w-full ${color.accent} text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      {deck.studiedCards > 0 ? 'Review Cards' : 'Start Studying'}
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Study Stats Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-normal text-black mb-6">Your Study Stats</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Grid className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cards Mastered</p>
                  <p className="text-2xl font-semibold text-gray-900">241</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">Total cards learned</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Accuracy</p>
                  <p className="text-2xl font-semibold text-gray-900">81%</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium">+5% this week</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Study Time</p>
                  <p className="text-2xl font-semibold text-gray-900">18h</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">Total study time</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Study Streak</p>
                  <p className="text-2xl font-semibold text-gray-900">9 days</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium">On fire!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
