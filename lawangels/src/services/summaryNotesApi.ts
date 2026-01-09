/**
 * API service for Summary Notes feature.
 * Handles fetching summary notes, chapters, and progress tracking.
 */

const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000/api'
    }
    return 'https://quiz-backend.onrender.com/api'
}

// Get CSRF token from cookie
const getCsrfToken = (): string | null => {
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

const getAuthHeaders = (includeCSRF: boolean = false): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('authToken')
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    // Include CSRF token for POST requests
    if (includeCSRF) {
        const csrfToken = getCsrfToken()
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken
        }
    }
    return headers
}

// Types
export interface SummaryNotesChapter {
    id: number
    title: string
    order: number
    is_completed: boolean
}

export interface SummaryNotesChapterDetail extends SummaryNotesChapter {
    content: string
    previous_chapter_id: number | null
    next_chapter_id: number | null
    chapter_number: number
    total_chapters: number
}

export interface SummaryNotes {
    id: number
    title: string
    subject: string
    category: 'FLK1' | 'FLK2'
    category_display: string
    description: string
    icon: string
    order: number
    total_chapters: number
    chapters_completed: number
    progress_percentage: number
}

export interface SummaryNotesDetail extends SummaryNotes {
    chapters: SummaryNotesChapter[]
    current_chapter_id: number | null
}

export interface ProgressUpdate {
    current_chapter_id: number | null
    chapters_completed: number
    progress_percentage: number
    completed_chapters: number[]
}

// API Functions
export const summaryNotesApi = {
    /**
     * Get all summary notes courses.
     */
    async list(): Promise<SummaryNotes[]> {
        const response = await fetch(`${getApiBaseUrl()}/summary-notes/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        // Handle paginated response (DRF returns { results: [...] })
        return Array.isArray(data) ? data : (data.results || [])
    },

    /**
     * Get a single summary notes course with chapter list.
     */
    async get(id: number): Promise<SummaryNotesDetail> {
        const response = await fetch(`${getApiBaseUrl()}/summary-notes/${id}/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
    },

    /**
     * Get a specific chapter's content.
     */
    async getChapter(notesId: number, chapterId: number): Promise<SummaryNotesChapterDetail> {
        const response = await fetch(
            `${getApiBaseUrl()}/summary-notes/${notesId}/chapter/${chapterId}/`,
            {
                method: 'GET',
                credentials: 'include',
                headers: getAuthHeaders(),
            }
        )
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
    },

    /**
     * Update reading progress.
     */
    async updateProgress(
        notesId: number,
        chapterId: number,
        markCompleted: boolean = false
    ): Promise<ProgressUpdate> {
        const response = await fetch(`${getApiBaseUrl()}/summary-notes/${notesId}/progress/`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(true),
            body: JSON.stringify({
                chapter_id: chapterId,
                mark_completed: markCompleted,
            }),
        })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
    },
}

export default summaryNotesApi
