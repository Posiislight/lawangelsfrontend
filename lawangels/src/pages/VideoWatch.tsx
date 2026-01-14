import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, Play, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { videoApi, type VideoDetail, type Video } from '../services/videoApi'

interface CourseVideos {
    course_title: string
    course_slug: string
    videos: Video[]
}

export default function VideoWatch() {
    const { videoId } = useParams<{ videoId: string }>()
    const navigate = useNavigate()
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const [video, setVideo] = useState<VideoDetail | null>(null)
    const [courseVideos, setCourseVideos] = useState<CourseVideos | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCompleting, setIsCompleting] = useState(false)

    // Load video and course data
    useEffect(() => {
        const loadData = async () => {
            if (!videoId) return

            setLoading(true)
            setError(null)

            try {
                const [videoData, courseData] = await Promise.all([
                    videoApi.getVideo(parseInt(videoId)),
                    videoApi.getCourseVideos(parseInt(videoId))
                ])
                setVideo(videoData)
                setCourseVideos(courseData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load video')
            } finally {
                setLoading(false)
            }
        }

        loadData()

        // Cleanup progress interval on unmount
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [videoId])

    // Update progress periodically while watching
    const startProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
        }

        // Update progress every 30 seconds
        progressIntervalRef.current = setInterval(async () => {
            if (video && iframeRef.current) {
                // Note: Cloudflare Stream iframe doesn't expose currentTime directly
                // In production, you'd use the Stream Player API to get current time
                // For now, we'll estimate based on elapsed time
                // This is a placeholder - actual implementation would use Stream's JS API
            }
        }, 30000)
    }, [video])

    useEffect(() => {
        if (video) {
            startProgressTracking()
        }
    }, [video, startProgressTracking])

    const handleMarkComplete = async () => {
        if (!video || isCompleting) return

        setIsCompleting(true)
        try {
            await videoApi.markComplete(video.id)
            // Reload video data to get updated completion status
            const updatedVideo = await videoApi.getVideo(video.id)
            setVideo(updatedVideo)

            // Also refresh course videos to update progress
            const courseData = await videoApi.getCourseVideos(video.id)
            setCourseVideos(courseData)
        } catch (err) {
            console.error('Failed to mark complete:', err)
        } finally {
            setIsCompleting(false)
        }
    }

    const handleNavigate = (targetVideoId: number | null) => {
        if (targetVideoId) {
            navigate(`/video-tutorials/watch/${targetVideoId}`)
        }
    }

    // Calculate course progress
    const completedCount = courseVideos?.videos.filter(v => v.is_completed).length || 0
    const totalCount = courseVideos?.videos.length || 0
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (error || !video || !courseVideos) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
                    <Link
                        to="/video-tutorials"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Video Tutorials
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 md:px-8 md:py-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/video-tutorials"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>

                        {/* Mobile Progress (shown in top row) */}
                        <div className="flex md:hidden items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600">{progressPercentage}% Complete</span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="text-left md:text-center">
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900 line-clamp-1">Video Tutorials</h1>
                        <p className="text-xs md:text-sm text-gray-600 truncate max-w-[300px] md:max-w-none">
                            {courseVideos.course_title} • Video {video.video_number} of {video.total_course_videos}
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="font-semibold text-blue-600">{progressPercentage}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column - Video Player */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        {/* Video Player */}
                        <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative shadow-lg">
                            <iframe
                                ref={iframeRef}
                                src={video.embed_url || `https://iframe.videodelivery.net/${video.cloudflare_video_id}?autoplay=false`}
                                className="w-full h-full"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Video Info Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm text-gray-500 mb-1">
                                        Video {video.video_number} of {video.total_course_videos}
                                    </p>
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug">{video.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {video.duration_formatted}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleMarkComplete}
                                    disabled={video.is_completed || isCompleting}
                                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${video.is_completed
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                                        }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {isCompleting ? 'Saving...' : video.is_completed ? 'Completed' : 'Mark Complete'}
                                </button>
                            </div>

                            {/* Description */}
                            {video.description && (
                                <div className="mt-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">About this video</h3>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">{video.description}</p>
                                </div>
                            )}

                            {/* Key Topics */}
                            {video.key_topics && video.key_topics.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Key Topics Covered</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {video.key_topics.map((topic, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
                                                <span className="text-gray-700 text-sm">{topic}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleNavigate(video.previous_video_id)}
                                    disabled={!video.previous_video_id}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${video.previous_video_id
                                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Previous Video
                                </button>

                                <button
                                    onClick={() => handleNavigate(video.next_video_id)}
                                    disabled={!video.next_video_id}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${video.next_video_id
                                        ? 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Next Video
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Course Playlist */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 sticky top-24 shadow-sm">
                            {/* Playlist Header */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{courseVideos.course_title}</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-gray-600">
                                        {completedCount} of {totalCount} completed
                                    </p>
                                    <span className="text-xs font-medium text-emerald-600">{progressPercentage}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Video List */}
                            <div className="max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                                {courseVideos.videos.map((v, idx) => {
                                    const isCurrentVideo = v.id === video.id
                                    const isCompleted = v.is_completed

                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => !isCurrentVideo && navigate(`/video-tutorials/watch/${v.id}`)}
                                            className={`w-full p-4 flex items-start gap-3 text-left transition-colors border-l-4 ${isCurrentVideo
                                                ? 'bg-cyan-50 border-l-cyan-500'
                                                : 'border-l-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Status Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                                                ? 'bg-emerald-100'
                                                : isCurrentVideo
                                                    ? 'bg-cyan-500'
                                                    : 'bg-gray-100'
                                                }`}>
                                                {isCompleted ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Play className={`w-3.5 h-3.5 ${isCurrentVideo ? 'text-white' : 'text-gray-400'}`} />
                                                )}
                                            </div>

                                            {/* Video Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium ${isCompleted ? 'text-emerald-600' : 'text-gray-500'
                                                    }`}>
                                                    Video {idx + 1}
                                                </p>
                                                <p className={`text-sm font-medium line-clamp-2 ${isCurrentVideo ? 'text-cyan-700' : 'text-gray-900'
                                                    }`}>
                                                    {v.title}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {v.duration_formatted}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
