/**
 * Topic Quiz API Client
 * 
 * API client for the gamified topic-based quiz feature.
 * Handles topic listing, quiz sessions, answer submission, and results.
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

export interface UserGameProfile {
    id: number;
    username: string;
    total_points: number;
    current_level: number;
    xp: number;
    xp_to_next_level: number;
    xp_progress_percentage: number;
    rank: string;
    rank_display: string;
    total_quizzes_completed: number;
    total_correct_answers: number;
    total_wrong_answers: number;
    longest_streak: number;
    created_at: string;
    updated_at: string;
}

export interface TopicSummary {
    topic: string;
    topic_display: string;
    question_count: number;
    user_attempts: number;
    best_score: number | null;
    best_percentage: number | null;
    icon: string;
}

export interface QuestionOption {
    label: string;
    text: string;
}

export interface TopicQuestion {
    id: number;
    question_number: number;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    options: QuestionOption[];
}

export interface TopicQuestionWithAnswer extends TopicQuestion {
    correct_answer: string;
    explanation: string;
}

export interface TopicQuizAnswer {
    id: number;
    question_id: number;
    selected_answer: string;
    is_correct: boolean;
    points_earned: number;
    time_spent_seconds: number;
    answered_at: string;
}

export interface TopicQuizAttempt {
    id: number;
    topic: string;
    topic_display: string;
    status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
    status_display: string;
    lives_remaining: number;
    points_earned: number;
    current_streak: number;
    current_question_index: number;
    total_questions: number;
    questions_remaining: number;
    progress_percentage: number;
    correct_count: number;
    wrong_count: number;
    fifty_fifty_used: boolean;
    time_freeze_used: boolean;
    started_at: string;
    completed_at: string | null;
    answers: TopicQuizAnswer[];
}

export interface CurrentQuestionResponse {
    question: TopicQuestion;
    question_number: number;
    total_questions: number;
    lives_remaining: number;
    points_earned: number;
    current_streak: number;
}

export interface SubmitAnswerResponse {
    is_correct: boolean;
    correct_answer: string;
    explanation: string;
    points_earned: number;
    total_points: number;
    lives_remaining: number;
    current_streak: number;
    quiz_status: 'in_progress' | 'completed' | 'failed';
    next_question: TopicQuestion | null;
}

export interface QuizSummaryResponse extends TopicQuizAttempt {
    accuracy_percentage: number;
    xp_earned: number;
    user_profile: {
        current_level: number;
        rank: string;
        rank_display: string;
        total_points: number;
        xp: number;
        xp_to_next_level: number;
    };
}

export interface FiftyFiftyResponse {
    eliminated_options: string[];
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

class TopicQuizApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        console.log('[TopicQuizAPI] Initialized with base URL:', this.baseUrl);
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

    // ============ Game Profile ============

    async getGameProfile(): Promise<UserGameProfile> {
        return this.request<UserGameProfile>('/game-profile/');
    }

    // ============ Topics ============

    async getTopics(): Promise<TopicSummary[]> {
        return this.request<TopicSummary[]>('/topics/');
    }

    async getTopicQuestions(topic: string): Promise<TopicQuestion[]> {
        return this.request<TopicQuestion[]>(`/topics/${topic}/questions/`);
    }

    // ============ Quiz Attempts ============

    async startQuiz(topic: string, numQuestions: number = 5): Promise<TopicQuizAttempt> {
        return this.request<TopicQuizAttempt>('/topic-attempts/', {
            method: 'POST',
            body: JSON.stringify({ topic, num_questions: numQuestions }),
        });
    }

    async getAttempt(attemptId: number): Promise<TopicQuizAttempt> {
        return this.request<TopicQuizAttempt>(`/topic-attempts/${attemptId}/`);
    }

    async getAttempts(): Promise<TopicQuizAttempt[]> {
        return this.request<TopicQuizAttempt[]>('/topic-attempts/');
    }

    async getCurrentQuestion(attemptId: number): Promise<CurrentQuestionResponse> {
        return this.request<CurrentQuestionResponse>(`/topic-attempts/${attemptId}/current-question/`);
    }

    async submitAnswer(
        attemptId: number,
        questionId: number,
        selectedAnswer: string,
        timeSpentSeconds: number = 0
    ): Promise<SubmitAnswerResponse> {
        return this.request<SubmitAnswerResponse>(`/topic-attempts/${attemptId}/submit-answer/`, {
            method: 'POST',
            body: JSON.stringify({
                question_id: questionId,
                selected_answer: selectedAnswer,
                time_spent_seconds: timeSpentSeconds,
            }),
        });
    }

    async getQuizSummary(attemptId: number): Promise<QuizSummaryResponse> {
        return this.request<QuizSummaryResponse>(`/topic-attempts/${attemptId}/summary/`);
    }

    // ============ Power-ups ============

    async useFiftyFifty(attemptId: number): Promise<FiftyFiftyResponse> {
        return this.request<FiftyFiftyResponse>(`/topic-attempts/${attemptId}/use-powerup/`, {
            method: 'POST',
            body: JSON.stringify({ powerup: 'fifty_fifty' }),
        });
    }

    async useTimeFreeze(attemptId: number): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/topic-attempts/${attemptId}/use-powerup/`, {
            method: 'POST',
            body: JSON.stringify({ powerup: 'time_freeze' }),
        });
    }
}

// Export singleton instance
export const topicQuizApi = new TopicQuizApiClient();
export default topicQuizApi;
