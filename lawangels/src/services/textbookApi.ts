/**
 * Textbook API Client
 * 
 * API client for fetching textbooks and PDF files.
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

export type TextbookCategory = 'FLK1' | 'FLK2' | 'BOTH';

export interface Chapter {
    title: string;
    page: number;
}

export interface Textbook {
    id: number;
    title: string;
    subject: string;
    description: string;
    category: TextbookCategory;
    category_display: string;
    file_name: string;
    icon: string;
    order: number;
    chapters: Chapter[];
    cdn_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface TextbookListItem {
    id: number;
    title: string;
    subject: string;
    category: TextbookCategory;
    category_display: string;
    icon: string;
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

// Cache for textbooks list (60 seconds)
let textbooksCache: { data: TextbookListItem[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

class TextbookApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        console.log('[TextbookAPI] Initialized with base URL:', this.baseUrl);
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

    // ============ Textbooks ============

    async getTextbooks(category?: TextbookCategory): Promise<TextbookListItem[]> {
        // Use cache for non-filtered requests (most common case)
        if (!category && textbooksCache) {
            const age = Date.now() - textbooksCache.timestamp;
            if (age < CACHE_DURATION_MS) {
                console.log('[TextbookAPI] Returning cached textbooks');
                return textbooksCache.data;
            }
        }

        const params = category ? `?category=${category}` : '';
        const data = await this.request<TextbookListItem[]>(`/textbooks/${params}`);

        // Cache the result for non-filtered requests
        if (!category) {
            textbooksCache = { data, timestamp: Date.now() };
            console.log('[TextbookAPI] Cached textbooks list');
        }

        return data;
    }

    // Prefetch textbooks in background (call on app init)
    prefetchTextbooks(): void {
        if (!textbooksCache) {
            this.getTextbooks().catch(() => {
                // Silently fail prefetch - it's just an optimization
            });
        }
    }

    async getTextbook(id: number): Promise<Textbook> {
        return this.request<Textbook>(`/textbooks/${id}/`);
    }

    getPdfUrl(id: number, download: boolean = false): string {
        const authToken = getAuthToken();
        const downloadParam = download ? '&download=true' : '';
        // For PDF viewing, we need to construct the URL with auth
        return `${this.baseUrl}/textbooks/${id}/pdf/?token=${authToken}${downloadParam}`;
    }
}

// Export singleton instance
export const textbookApi = new TextbookApiClient();
export default textbookApi;
