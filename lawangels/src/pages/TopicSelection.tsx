import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Trophy, Star, Zap, Target, BookOpen, Scale,
    Building2, FileText, Users, Loader, ChevronRight,
    Flame
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import { topicQuizApi } from '../services/topicQuizApi'
import type { TopicSummary, UserGameProfile } from '../services/topicQuizApi'

// Topic icon mapping
const TOPIC_ICONS: Record<string, React.ReactNode> = {
    taxation: <Building2 className="w-8 h-8" />,
    criminal_law: <Scale className="w-8 h-8" />,
    criminal_practice: <Target className="w-8 h-8" />,
    land_law: <Building2 className="w-8 h-8" />,
    solicitors_accounts: <FileText className="w-8 h-8" />,
    professional_ethics: <BookOpen className="w-8 h-8" />,
    trusts: <Users className="w-8 h-8" />,
    wills: <FileText className="w-8 h-8" />,
}

// Topic color mapping
const TOPIC_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    taxation: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    criminal_law: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-red-100' },
    criminal_practice: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    land_law: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100' },
    solicitors_accounts: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    professional_ethics: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    trusts: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', iconBg: 'bg-teal-100' },
    wills: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
}

export default function TopicSelection() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [topics, setTopics] = useState<TopicSummary[]>([])
    const [profile, setProfile] = useState<UserGameProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [startingQuiz, setStartingQuiz] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [topicsData, profileData] = await Promise.all([
                    topicQuizApi.getTopics(),
                    topicQuizApi.getGameProfile()
                ])
                setTopics(topicsData)
                setProfile(profileData)
                setError(null)
            } catch (err) {
                console.error('Error fetching data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load topics')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleStartQuiz = async (topic: string) => {
        try {
            setStartingQuiz(topic)
            const attempt = await topicQuizApi.startQuiz(topic, 5)
            navigate(`/quiz/play/${topic}/${attempt.id}`)
        } catch (err) {
            console.error('Error starting quiz:', err)
            setError(err instanceof Error ? err.message : 'Failed to start quiz')
            setStartingQuiz(null)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
                        <p className="text-gray-600 font-medium">Loading topics...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50/30">
                {/* Header */}
                <div className="bg-[#0F172B] text-white px-8 py-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold mb-1">Topic Quizzes</h1>
                                <p className="text-gray-400">Challenge yourself with topic-specific quizzes</p>
                            </div>

                            {/* User Stats Badge */}
                            {profile && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">{profile.current_level}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Level</p>
                                            <p className="text-sm font-medium">{profile.rank_display}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-amber-500/20 rounded-full px-4 py-2">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        <span className="font-bold text-amber-400">{profile.total_points} pts</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* XP Progress Bar */}
                        {profile && (
                            <div className="mt-4 max-w-md">
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span>Level {profile.current_level}</span>
                                    <span>{profile.xp} / {profile.xp_to_next_level} XP</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${profile.xp_progress_percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Overview */}
                {profile && (
                    <div className="max-w-6xl mx-auto px-8 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{profile.total_quizzes_completed}</p>
                                        <p className="text-xs text-gray-500">Quizzes Completed</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                        <Target className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{profile.total_correct_answers}</p>
                                        <p className="text-xs text-gray-500">Correct Answers</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Flame className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{profile.longest_streak}</p>
                                        <p className="text-xs text-gray-500">Best Streak</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Star className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {profile.total_correct_answers + profile.total_wrong_answers > 0
                                                ? Math.round((profile.total_correct_answers / (profile.total_correct_answers + profile.total_wrong_answers)) * 100)
                                                : 0}%
                                        </p>
                                        <p className="text-xs text-gray-500">Accuracy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="max-w-6xl mx-auto px-8">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                            {error}
                        </div>
                    </div>
                )}

                {/* Topics Grid */}
                <div className="max-w-6xl mx-auto px-8 pb-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Topic</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topics.map((topic) => {
                            const colors = TOPIC_COLORS[topic.topic] || TOPIC_COLORS.taxation
                            const icon = TOPIC_ICONS[topic.topic] || <BookOpen className="w-8 h-8" />
                            const isStarting = startingQuiz === topic.topic

                            return (
                                <div
                                    key={topic.topic}
                                    className={`${colors.bg} ${colors.border} border rounded-2xl p-6 hover:shadow-lg transition-all duration-200 group`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`${colors.iconBg} p-3 rounded-xl ${colors.text}`}>
                                            {icon}
                                        </div>
                                        {topic.best_percentage !== null && (
                                            <div className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="text-sm font-medium text-gray-700">{topic.best_percentage}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{topic.topic_display}</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {topic.question_count} questions available
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            {topic.user_attempts > 0 ? (
                                                <span>{topic.user_attempts} attempt{topic.user_attempts !== 1 ? 's' : ''}</span>
                                            ) : (
                                                <span>Not attempted yet</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleStartQuiz(topic.topic)}
                                            disabled={isStarting || topic.question_count === 0}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                        ${topic.question_count === 0
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-[#0F172B] text-white hover:bg-[#1E293B] active:scale-95'
                                                }`}
                                        >
                                            {isStarting ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Starting...
                                                </>
                                            ) : (
                                                <>
                                                    Play <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
