/**
 * Progress API Client
 * 
 * API client for fetching user progress statistics for the Progress Tracker page.
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

export interface OverallProgress {
    overall_percentage: number;
    quiz_accuracy: number;
    exam_accuracy: number;
    quizzes_completed: number;
    total_points: number;
    current_level: number;
    rank: string;
    rank_display: string;
    xp: number;
    xp_to_next_level: number;
    streak_days: number;
    longest_streak: number;
}

export interface WeeklyActivity {
    day: string;
    hours: number;
    quizzes: number;
    correct: number;
    total: number;
}

export interface PerformanceTrend {
    week: string;
    score: number | null;
}

export interface CourseProgress {
    name: string;
    topic: string;
    progress: number;
    completed_quizzes: number;
    correct_answers: number;
    total_questions: number;
    color: string;
}

export interface LearningDistribution {
    name: string;
    value: number;
    color: string;
}

export interface RecentActivity {
    type: string;
    title: string;
    course: string;
    status: string;
    completed: boolean;
    score: number | null;
    timestamp: string;
    status_text: string;
    icon_type: string;
}

export interface UserProgressData {
    overall_progress: OverallProgress;
    weekly_activity: WeeklyActivity[];
    performance_trend: PerformanceTrend[];
    course_progress: CourseProgress[];
    learning_distribution: LearningDistribution[];
    recent_activity: RecentActivity[];
}

export interface ProgressSummary {
    quizzes_completed: number;
    total_points: number;
    accuracy: number;
    streak_days: number;
    level: number;
    rank: string;
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

class ProgressApiClient {
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

    /**
     * Get comprehensive user progress data for the Progress Tracker page
     */
    async getProgress(): Promise<UserProgressData> {
        return this.request<UserProgressData>('/progress/');
    }

    /**
     * Get quick summary stats for dashboard widgets
     */
    async getSummary(): Promise<ProgressSummary> {
        return this.request<ProgressSummary>('/progress/summary/');
    }
}

// Export singleton instance
export const progressApi = new ProgressApiClient();
export default progressApi;
