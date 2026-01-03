/**
 * Video API Client
 * 
 * API client for video courses, individual videos, and progress tracking.
 * Uses Cloudflare Stream for video delivery.
 */

// Get API base URL dynamically
const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000/api';
    }

    return 'https://quiz-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// ============ Types ============

export interface Video {
    id: number;
    title: string;
    description: string;
    cloudflare_video_id: string | null;
    bunny_video_id: string | null;
    video_platform: 'cloudflare' | 'bunny';
    embed_url: string;
    duration_seconds: number;
    duration_formatted: string;
    order: number;
    key_topics: string[];
    thumbnail_url: string;
    is_completed: boolean;
    watched_seconds: number;
    progress_percentage: number;
}

export interface VideoCourse {
    id: number;
    title: string;
    slug: string;
    category: 'FLK1' | 'FLK2';
    category_display: string;
    description: string;
    thumbnail_url: string;
    order: number;
    total_videos: number;
    total_duration_formatted: string;
    videos_completed: number;
    progress_percentage: number;
    first_video_id: number | null;
    next_video_id: number | null;
}

export interface VideoCourseDetail extends VideoCourse {
    videos: Video[];
}

export interface VideoDetail extends Video {
    course_title: string;
    course_slug: string;
    next_video_id: number | null;
    previous_video_id: number | null;
    video_number: number;
    total_course_videos: number;
}

export interface CourseVideosResponse {
    course_title: string;
    course_slug: string;
    videos: Video[];
}

export interface VideoProgressResponse {
    watched_seconds: number;
    progress_percentage: number;
    is_completed: boolean;
}

export interface VideoCompleteResponse {
    is_completed: boolean;
    completed_at: string;
    course_videos_completed: number;
    course_progress_percentage: number;
}

export interface OverallVideoStats {
    total_videos: number;
    completed_videos: number;
    total_courses: number;
    courses_started: number;
    courses_completed: number;
    total_watched_seconds: number;
    total_watched_formatted: string;
    continue_watching: {
        video_id: number;
        video_title: string;
        course_title: string;
        course_slug: string;
        duration_formatted: string;
    }[];
}

// ============ Helper Functions ============

function getCsrfToken(): string | null {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getAuthToken(): string | null {
    return localStorage.getItem('authToken');
}

// ============ API Client Class ============

// Cache for courses list (60 seconds)
let coursesCache: { data: VideoCourse[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

class VideoApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const authToken = getAuthToken();
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // ============ Courses ============

    async getCourses(): Promise<VideoCourse[]> {
        // Use cache if available
        if (coursesCache) {
            const age = Date.now() - coursesCache.timestamp;
            if (age < CACHE_DURATION_MS) {
                return coursesCache.data;
            }
        }

        // Handle both array and paginated response formats
        const response = await this.request<VideoCourse[] | { results: VideoCourse[] }>('/video-courses/');
        const data = Array.isArray(response) ? response : (response.results || []);
        coursesCache = { data, timestamp: Date.now() };
        return data;
    }

    async getCourse(slug: string): Promise<VideoCourseDetail> {
        return this.request<VideoCourseDetail>(`/video-courses/${slug}/`);
    }

    // Prefetch courses in background
    prefetchCourses(): void {
        if (!coursesCache) {
            this.getCourses().catch(() => {
                // Silently fail prefetch
            });
        }
    }

    // Clear cache (call after marking video complete)
    clearCache(): void {
        coursesCache = null;
    }

    // ============ Videos ============

    async getVideo(id: number): Promise<VideoDetail> {
        return this.request<VideoDetail>(`/videos/${id}/`);
    }

    async getCourseVideos(videoId: number): Promise<CourseVideosResponse> {
        return this.request<CourseVideosResponse>(`/videos/${videoId}/course_videos/`);
    }

    async updateProgress(videoId: number, watchedSeconds: number): Promise<VideoProgressResponse> {
        return this.request<VideoProgressResponse>(`/videos/${videoId}/update_progress/`, {
            method: 'POST',
            body: JSON.stringify({ watched_seconds: watchedSeconds }),
        });
    }

    async markComplete(videoId: number): Promise<VideoCompleteResponse> {
        this.clearCache(); // Clear cache so next fetch shows updated progress
        return this.request<VideoCompleteResponse>(`/videos/${videoId}/mark_complete/`, {
            method: 'POST',
        });
    }

    // ============ Stats ============

    /**
     * OPTIMIZED: Get all data for VideoTutorials page in ONE call
     * Much faster than calling getCourses() + getOverallStats() separately
     */
    async getPageData(): Promise<{ courses: VideoCourse[]; stats: OverallVideoStats }> {
        const response = await this.request<{ courses: VideoCourse[]; stats: OverallVideoStats }>('/video-progress/page_data/');
        // Update cache with the courses
        coursesCache = { data: response.courses, timestamp: Date.now() };
        return response;
    }

    async getOverallStats(): Promise<OverallVideoStats> {
        return this.request<OverallVideoStats>('/video-progress/');
    }

    // ============ Cloudflare Stream Helpers ============

    /**
     * Get the Cloudflare Stream iframe embed URL
     * You'll need to replace CUSTOMER_CODE with your actual Cloudflare customer subdomain
     */
    getStreamEmbedUrl(cloudflareVideoId: string): string {
        // The customer code comes from your Cloudflare Stream dashboard
        // It looks like: customer-xxxxx.cloudflarestream.com
        return `https://iframe.cloudflarestream.com/${cloudflareVideoId}`;
    }

    /**
     * Get thumbnail URL for a Cloudflare Stream video
     */
    getThumbnailUrl(cloudflareVideoId: string, options?: {
        time?: string;  // e.g., "10s" for 10 second mark
        height?: number;
        width?: number;
    }): string {
        let url = `https://cloudflarestream.com/${cloudflareVideoId}/thumbnails/thumbnail.jpg`;
        const params: string[] = [];

        if (options?.time) params.push(`time=${options.time}`);
        if (options?.height) params.push(`height=${options.height}`);
        if (options?.width) params.push(`width=${options.width}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return url;
    }
}

// Export singleton instance
export const videoApi = new VideoApiClient();
export default videoApi;
