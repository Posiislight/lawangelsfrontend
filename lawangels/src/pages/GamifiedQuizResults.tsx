import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Trophy, Star, Zap, RotateCcw, Home,
    Check, X, Loader, TrendingUp, Target, Flame
} from 'lucide-react'
import { topicQuizApi } from '../services/topicQuizApi'
import type { QuizSummaryResponse } from '../services/topicQuizApi'

export default function GamifiedQuizResults() {
    const { attemptId } = useParams<{ attemptId: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [summary, setSummary] = useState<QuizSummaryResponse | null>(null)

    useEffect(() => {
        const fetchSummary = async () => {
            if (!attemptId) return

            try {
                setLoading(true)
                const data = await topicQuizApi.getQuizSummary(parseInt(attemptId, 10))
                setSummary(data)
                setError(null)
            } catch (err) {
                console.error('Error fetching summary:', err)
                setError(err instanceof Error ? err.message : 'Failed to load results')
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
    }, [attemptId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-cyan-400 animate-spin" />
                    <p className="text-white font-medium">Calculating results...</p>
                </div>
            </div>
        )
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Failed to load results'}</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        )
    }

    const isSuccess = summary.status === 'completed'
    const accuracyColor = summary.accuracy_percentage >= 80 ? 'text-green-400' :
        summary.accuracy_percentage >= 60 ? 'text-yellow-400' : 'text-red-400'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 font-worksans">
            <div className="max-w-2xl mx-auto">
                {/* Result Header */}
                <div className="text-center mb-8">
                    <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${isSuccess ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-orange-400 to-red-500'
                        }`}>
                        {isSuccess ? (
                            <Trophy className="w-12 h-12 text-white" />
                        ) : (
                            <Target className="w-12 h-12 text-white" />
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {isSuccess ? 'Quiz Complete!' : 'Game Over'}
                    </h1>
                    <p className="text-slate-400">
                        {summary.topic_display} Quiz
                    </p>
                </div>

                {/* Points Earned Card */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-cyan-100 text-sm mb-1">Points Earned</p>
                            <p className="text-4xl font-bold">{summary.points_earned}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Zap className="w-8 h-8" />
                        </div>
                    </div>

                    {/* XP Progress */}
                    {summary.user_profile && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-cyan-100">Level {summary.user_profile.current_level}</span>
                                <span className="text-white font-medium">
                                    {summary.user_profile.xp} / {summary.user_profile.xp_to_next_level} XP
                                </span>
                            </div>
                            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${(summary.user_profile.xp / summary.user_profile.xp_to_next_level) * 100}%`
                                    }}
                                />
                            </div>
                            <p className="text-center text-cyan-100 text-sm mt-2">
                                {summary.user_profile.rank_display}
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{summary.correct_count}</p>
                                <p className="text-xs text-slate-400">Correct</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <X className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{summary.wrong_count}</p>
                                <p className="text-xs text-slate-400">Incorrect</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${accuracyColor}`}>{summary.accuracy_percentage}%</p>
                                <p className="text-xs text-slate-400">Accuracy</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <Flame className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{summary.current_streak}</p>
                                <p className="text-xs text-slate-400">Best Streak</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lives Remaining (if failed) */}
                {summary.status === 'failed' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center">
                        <p className="text-red-400">
                            💔 You ran out of lives! Keep practicing to improve.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition"
                    >
                        <Home className="w-5 h-5" />
                        Back to Quizzes
                    </button>

                    <button
                        onClick={async () => {
                            if (!summary) return
                            try {
                                setLoading(true)
                                const newAttempt = await topicQuizApi.createAttempt(summary.topic)
                                navigate(`/quiz/play/${summary.topic}/${newAttempt.id}`)
                            } catch (err) {
                                console.error('Failed to restart quiz:', err)
                                setLoading(false)
                                // Optional: Show error toast/alert here
                            }
                        }}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition shadow-lg disabled:opacity-50"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                        {loading ? 'Starting...' : 'Play Again'}
                    </button>
                </div>

                {/* Motivational Message */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-slate-300 text-sm">
                            {summary.accuracy_percentage >= 80
                                ? "Outstanding! You're a legal expert!"
                                : summary.accuracy_percentage >= 60
                                    ? "Good job! Keep practicing to improve."
                                    : "Don't give up! Every attempt makes you stronger."}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
