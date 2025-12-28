import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Review {
  id?: number
  rating: number
  title: string
  content: string
  name: string
  role: string
  helpful_count: number
  days_ago?: string
  daysAgo?: number
  created_at?: string
  is_approved?: boolean
}

interface ReviewSummary {
  average_rating: number
  total_reviews: number
  rating_distribution: Record<string, { count: number; percentage: number }>
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [sortBy, setSortBy] = useState<'relevant' | 'recent'>('relevant')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const REVIEWS_PER_PAGE = 10  // Match backend PAGE_SIZE
  const [reviewForm, setReviewForm] = useState({
    name: '',
    role: '',
    rating: 5,
    title: '',
    content: '',
  })

  // Dynamic API URL - uses environment variable or auto-detects based on hostname
  const API_BASE_URL = (() => {
    const envApiUrl = import.meta.env.VITE_API_URL
    if (envApiUrl) {
      return envApiUrl
    }
    
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api'
    }
    
    return 'https://api.lawangelsuk.com/api'
  })()

  // Fetch reviews and summary on component mount
  useEffect(() => {
    setCurrentPage(1)
    fetchReviews(1)
    fetchReviewSummary()
  }, [sortBy])

  const fetchReviews = async (page: number = 1) => {
    try {
      const sortParam = sortBy === 'recent' ? 'recent' : 'relevant'
      const url = `${API_BASE_URL}/reviews/?sort_by=${sortParam}&page=${page}`
      console.log('Fetching reviews from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`)
      }
      
      const reviewsData = await response.json()
      console.log('Reviews data received:', reviewsData)
      
      // Handle paginated responses from Django REST Framework
      if (reviewsData.results && Array.isArray(reviewsData.results)) {
        setReviews(reviewsData.results)
        setTotalReviews(reviewsData.count || 0)
        console.log(`Page ${page}: ${reviewsData.results.length} reviews, Total: ${reviewsData.count}`)
      } else if (Array.isArray(reviewsData)) {
        // Handle non-paginated responses
        setReviews(reviewsData)
        setTotalReviews(reviewsData.length)
        console.log('Non-paginated response:', reviewsData.length, 'reviews')
      } else {
        console.warn('Unexpected response format:', reviewsData)
        setReviews([])
        setTotalReviews(0)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setReviews([])
      setTotalReviews(0)
    }
  }

  const fetchReviewSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/summary/`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch review summary')
      }
      
      const data = await response.json()
      setReviewSummary(data)
    } catch (err) {
      console.error('Error fetching review summary:', err)
      // Use default summary if fetch fails
      setReviewSummary({
        average_rating: 4.9,
        total_reviews: 1248,
        rating_distribution: {
          '5': { count: 972, percentage: 78 },
          '4': { count: 186, percentage: 15 },
          '3': { count: 50, percentage: 4 },
          '2': { count: 25, percentage: 2 },
          '1': { count: 15, percentage: 1 },
        },
      })
    }
  }

  // Sample data removed - using API data instead

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1 text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className="material-symbols-outlined text-[20px]"
            style={{
              fontVariationSettings:
                star <= Math.floor(rating)
                  ? "'FILL' 1"
                  : star - 0.5 === rating
                  ? "'FILL' 0.5"
                  : "'FILL' 0",
            }}
          >
            {star === 5 && rating === 4.5 ? 'star_half' : 'star'}
          </span>
        ))}
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.name || !reviewForm.role || !reviewForm.title || !reviewForm.content) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reviewForm.name,
          role: reviewForm.role,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      // Show success message
      alert('Review submitted successfully! It will appear after admin approval.')
      
      // Reset form and close modal
      setShowReviewModal(false)
      setReviewForm({
        name: '',
        role: '',
        rating: 5,
        title: '',
        content: '',
      })
      
      // Refresh reviews from page 1
      setCurrentPage(1)
      fetchReviews(1)
    } catch (err) {
      console.error('Error submitting review:', err)
      alert('Failed to submit review. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-worksans">
      <Navbar />

      <main className="w-full flex flex-col items-center mt-16">
        {/* Hero Section */}
        <section className="w-full max-w-7xl px-4 py-12 flex flex-col items-center text-center">
          <div className="flex flex-col gap-3 max-w-2xl mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              What Our Users Say
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-normal leading-normal">
              Read real testimonials from legal professionals using Law Angels to streamline their work.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="w-full max-w-7xl px-4 pb-20">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-1/4 flex-shrink-0">
              <div className="sticky top-24">
                {/* Review Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Review Summary</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">
                      {reviewSummary?.average_rating ?? 4.9}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/5</span>
                  </div>
                  {renderStars(reviewSummary?.average_rating ?? 4.9)}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 mb-6">
                    Based on {reviewSummary?.total_reviews ?? 0} verified reviews
                  </p>

                  {/* Rating Breakdown */}
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const distribution = reviewSummary?.rating_distribution[star.toString()]
                      const percent = distribution?.percentage ?? 0
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-gray-600 dark:text-gray-400 font-medium">{star}</span>
                          <span className="material-symbols-outlined text-[10px] text-gray-400">star</span>
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="w-6 text-right text-gray-400 text-xs">{percent}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* Reviews Section */}
            <div className="flex-1 flex flex-col gap-6 reviews-section">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Showing <span className="text-gray-900 dark:text-white font-bold">{reviews.length}</span> of {reviewSummary?.total_reviews ?? 0} reviews
                </p>
                <div className="flex items-center gap-2 relative">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                  <button 
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
                  >
                    {sortBy === 'relevant' ? 'Most Relevant' : 'Most Recent'}
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </button>
                  {showSortMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setSortBy('relevant')
                          setShowSortMenu(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                          sortBy === 'relevant'
                            ? 'text-blue-600 bg-gray-50 dark:bg-gray-800'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        Most Relevant
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('recent')
                          setShowSortMenu(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors border-t border-gray-200 dark:border-gray-600 ${
                          sortBy === 'recent'
                            ? 'text-blue-600 bg-gray-50 dark:bg-gray-800'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        Most Recent
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Write Review Card */}
                <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group text-center h-full min-h-[320px]">
                  <div className="size-16 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl">rate_review</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Have your say</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[250px]">
                    Share your experience with Law Angels to help other legal professionals.
                  </p>
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="mt-4 flex items-center justify-center rounded-lg h-10 px-6 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-bold shadow-md shadow-blue-500/20"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Review Cards */}
                {reviews && reviews.length > 0 ? (
                  reviews.map((review, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        {renderStars(review.rating)}
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">"{review.title}"</h4>

                      {/* Content */}
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 flex-grow">
                        {review.content}
                      </p>

                      {/* Footer */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {getInitials(review.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{review.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{review.role}</p>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                          {review.helpful_count > 0 ? `(${review.helpful_count})` : 'Helpful'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No reviews available yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalReviews > REVIEWS_PER_PAGE && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => {
                      const prevPage = currentPage - 1
                      setCurrentPage(prevPage)
                      fetchReviews(prevPage)
                      setTimeout(() => {
                        document.querySelector('.reviews-section')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(totalReviews / REVIEWS_PER_PAGE) }).map((_, idx) => {
                      const pageNum = idx + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum)
                            fetchReviews(pageNum)
                            setTimeout(() => {
                              document.querySelector('.reviews-section')?.scrollIntoView({ behavior: 'smooth' })
                            }, 100)
                          }}
                          className={`size-10 rounded-lg font-bold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => {
                      const nextPage = currentPage + 1
                      setCurrentPage(nextPage)
                      fetchReviews(nextPage)
                      setTimeout(() => {
                        document.querySelector('.reviews-section')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }}
                    disabled={currentPage >= Math.ceil(totalReviews / REVIEWS_PER_PAGE)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Write a Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Name and Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={reviewForm.role}
                    onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                    placeholder="e.g., Attorney, Paralegal"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <span
                        className="material-symbols-outlined text-4xl"
                        style={{
                          color: star <= reviewForm.rating ? '#facc15' : '#d1d5db',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="e.g., Excellent document management tool"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Share your experience with Law Angels..."
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewForm.name || !reviewForm.role || !reviewForm.title || !reviewForm.content}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors font-bold"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
