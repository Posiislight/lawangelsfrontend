/**
 * Smart Dynamic API Base URL Detection
 * 
 * Strategy:
 * 1. Use VITE_API_URL environment variable if available (explicit control)
 * 2. Auto-detect based on current hostname:
 *    - localhost/127.0.0.1 → http://localhost:8000/api
 *    - Vercel domain → https://quiz-backend.onrender.com/api
 *    - Custom domain → use configured production URL
 * 3. Fallback to production URL
 */

function getApiBaseUrl(): string {
  // 1. Check for explicit environment variable (Vite env var has highest priority)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('[QuizAPI] Using environment variable API URL:', envApiUrl);
    return envApiUrl;
  }

  // 2. Auto-detect based on hostname
  const hostname = window.location.hostname;

  // Development: localhost or 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const devUrl = `http://localhost:8000/api`;
    console.log('[QuizAPI] Development environment detected, using:', devUrl);
    return devUrl;
  }

  // Production: Vercel deployment or custom domain
  // All production deployments should use Render backend
  const productionUrl = 'https://quiz-backend.onrender.com/api';
  console.log('[QuizAPI] Production environment detected, using:', productionUrl);
  return productionUrl;
}

const API_BASE_URL = getApiBaseUrl();

// Types for API responses
export interface Question {
  id: number;
  question_number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
  explanation: string;
  correct_answer: string;
}

export interface QuestionDetail extends Question {
  explanation: string;
  correct_answer: string;
}

export interface QuestionOption {
  id: number;
  label: string;
  text: string;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  speed_reader_seconds: number;
  passing_score_percentage: number;
  total_questions: number;
  is_active: boolean;
}

export interface ExamDetail extends Exam {
  questions: Question[];
}

export interface ExamAttempt {
  id: number;
  exam_id?: number;
  exam?: Exam;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  ended_at: string | null;
  score: number | null;
  time_spent_seconds: number | null;
  speed_reader_enabled: boolean;
  selected_questions?: number[];
  answers?: Array<QuestionAnswer & { question: Question }>;
}

export interface QuestionAnswer {
  id: number;
  question_id: number;
  selected_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface ExamTimingConfig {
  default_duration_minutes: number;
  default_speed_reader_seconds: number;
  allow_custom_timing: boolean;
}

// Helper function to get CSRF token from cookie
function getCsrfToken(): string | null {
  const name = 'csrftoken'
  let cookieValue: string | null = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// Fetch CSRF token from Django
let csrfTokenCached = false;
async function fetchCsrfToken() {
  if (csrfTokenCached) return; // Only fetch once
  try {
    await fetch(`${API_BASE_URL}/auth/me/`, { 
      credentials: 'include',
      method: 'GET'
    })
    csrfTokenCached = true;
  } catch (error) {
    console.warn('Could not fetch CSRF token:', error)
  }
}

// API Client
class QuizApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('[QuizAPI] Initialized with base URL:', this.baseUrl);
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Fetch CSRF token if needed (only once)
      await fetchCsrfToken();
      
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      // Add CSRF token for non-GET requests
      if (options.method && options.method !== 'GET' && csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const defaultOptions: RequestInit = {
        credentials: 'include', // Include cookies for session auth
        ...options,
        headers,
      };

      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `API error: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Exams
  async getExams(): Promise<Exam[]> {
    return this.request('/exams/');
  }

  async getExam(id: number): Promise<ExamDetail> {
    return this.request(`/exams/${id}/`);
  }

  async getExamQuestions(id: number): Promise<Question[]> {
    return this.request(`/exams/${id}/questions/`);
  }

  async getAttemptQuestions(attemptId: number): Promise<Question[]> {
    return this.request(`/exam-attempts/${attemptId}/questions/`);
  }

  async getExamTimingConfig(): Promise<ExamTimingConfig> {
    return this.request('/exams/config/');
  }

  // Questions
  async getQuestions(examId?: number): Promise<Question[]> {
    let endpoint = '/questions/';
    if (examId) {
      endpoint += `?exam_id=${examId}`;
    }
    return this.request(endpoint);
  }

  async getQuestion(id: number): Promise<QuestionDetail> {
    return this.request(`/questions/${id}/`);
  }

  // Exam Attempts
  async startExam(examId: number, speedReaderEnabled: boolean = false): Promise<ExamAttempt> {
    return this.request('/exam-attempts/', {
      method: 'POST',
      body: JSON.stringify({
        exam_id: examId,
        speed_reader_enabled: speedReaderEnabled,
      }),
    });
  }

  async getAttempt(id: number): Promise<ExamAttempt> {
    return this.request(`/exam-attempts/${id}/`);
  }

  async getAttempts(): Promise<ExamAttempt[]> {
    return this.request('/exam-attempts/');
  }

  async submitAnswer(
    attemptId: number,
    questionId: number,
    selectedAnswer: string,
    timeSpentSeconds: number
  ): Promise<QuestionAnswer> {
    return this.request(`/exam-attempts/${attemptId}/submit-answer/`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer,
        time_spent_seconds: timeSpentSeconds,
      }),
    });
  }

  async endExam(attemptId: number): Promise<ExamAttempt> {
    return this.request(`/exam-attempts/${attemptId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'completed',
      }),
    });
  }

  async getReview(attemptId: number): Promise<ExamAttempt> {
    return this.request(`/exam-attempts/${attemptId}/review/`);
  }
}

// Export singleton instance
export const quizApi = new QuizApiClient();
