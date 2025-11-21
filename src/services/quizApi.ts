const API_BASE_URL = 'http://localhost:8000/api';

// Types for API responses
export interface Question {
  id: number;
  question_number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
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
  exam_id: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  ended_at: string | null;
  score: number | null;
  time_spent_seconds: number | null;
  speed_reader_enabled: boolean;
  selected_questions?: number[];
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
    await fetch('http://localhost:8000/api/auth/me/', { 
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
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

  async getReview(attemptId: number): Promise<{
    attempt: ExamAttempt;
    answers: Array<QuestionAnswer & { question: QuestionDetail }>;
  }> {
    return this.request(`/exam-attempts/${attemptId}/review/`);
  }
}

// Export singleton instance
export const quizApi = new QuizApiClient();
