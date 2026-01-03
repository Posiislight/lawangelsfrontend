/**
 * Angel AI API Client
 * 
 * Client for communicating with the Angel AI backend.
 * Supports both regular and streaming responses.
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

// ============ Types ============

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

export interface Chat {
    id: string;
    title: string;
    date: string;
    messages: ChatMessage[];
}

export interface SendMessageResponse {
    response: string;
    success: boolean;
    error?: string;
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

function formatTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            return `${diffDays} days ago`;
        }
        return date.toLocaleDateString();
    }
}

// ============ API Client Class ============

class AngelAIApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = getApiBaseUrl();
        console.log('[AngelAI] Initialized with base URL:', this.baseUrl);
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const authToken = getAuthToken();
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        return headers;
    }

    // ============ Chat Methods ============

    /**
     * Send a message to Angel AI and get a response (non-streaming).
     */
    async sendMessage(
        message: string,
        conversationHistory: ChatMessage[] = []
    ): Promise<SendMessageResponse> {
        const response = await fetch(`${this.baseUrl}/ai/chat/`, {
            method: 'POST',
            headers: this.getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                message,
                conversation_history: conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Send a message to Angel AI with streaming response.
     * Returns an async generator that yields content chunks.
     */
    async *streamMessage(
        message: string,
        conversationHistory: ChatMessage[] = []
    ): AsyncGenerator<{ content?: string; done?: boolean; error?: string }> {
        const response = await fetch(`${this.baseUrl}/ai/stream/`, {
            method: 'POST',
            headers: this.getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                message,
                conversation_history: conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            yield data;

                            if (data.done || data.error) {
                                return;
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    // ============ Conversation Persistence API ============

    /**
     * Get all conversations for the current user.
     */
    async getConversations(): Promise<Chat[]> {
        const response = await fetch(`${this.baseUrl}/ai/conversations/`, {
            method: 'GET',
            headers: this.getHeaders(),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.conversations.map((conv: { id: number; title: string; updated_at: string }) => ({
            id: String(conv.id),
            title: conv.title,
            date: formatDate(new Date(conv.updated_at)),
            messages: []
        }));
    }

    /**
     * Create a new conversation in the backend.
     */
    async createConversation(title: string = 'New Chat'): Promise<{ id: string; title: string }> {
        const response = await fetch(`${this.baseUrl}/ai/conversations/`, {
            method: 'POST',
            headers: this.getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { id: String(data.id), title: data.title };
    }

    /**
     * Get a specific conversation with all its messages.
     */
    async getConversation(conversationId: string): Promise<Chat> {
        const response = await fetch(`${this.baseUrl}/ai/conversations/${conversationId}/`, {
            method: 'GET',
            headers: this.getHeaders(),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return {
            id: String(data.id),
            title: data.title,
            date: formatDate(new Date(data.updated_at)),
            messages: data.messages.map((msg: { role: 'user' | 'ai'; content: string; timestamp: string }) => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        };
    }

    /**
     * Delete a conversation.
     */
    async deleteConversation(conversationId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/ai/conversations/${conversationId}/`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            credentials: 'include',
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`HTTP ${response.status}`);
        }
    }

    /**
     * Add a message to an existing conversation.
     */
    async addMessage(conversationId: string, role: 'user' | 'ai', content: string): Promise<{ timestamp: string; conversationTitle: string }> {
        const response = await fetch(`${this.baseUrl}/ai/conversations/${conversationId}/message/`, {
            method: 'POST',
            headers: this.getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ role, content }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { timestamp: data.timestamp, conversationTitle: data.conversation_title };
    }

    // ============ Chat Management Helpers ============

    /**
     * Create a new chat with an initial message.
     */
    createNewChat(title: string = 'New Chat'): Chat {
        return {
            id: `chat-${Date.now()}`,
            title,
            date: formatDate(new Date()),
            messages: []
        };
    }

    /**
     * Create a user message.
     */
    createUserMessage(content: string): ChatMessage {
        return {
            role: 'user',
            content,
            timestamp: formatTimestamp()
        };
    }

    /**
     * Create an AI message.
     */
    createAIMessage(content: string): ChatMessage {
        return {
            role: 'ai',
            content,
            timestamp: formatTimestamp()
        };
    }

    /**
     * Generate a title from the first message.
     */
    generateChatTitle(firstMessage: string): string {
        // Extract first ~30 chars and clean up
        const cleaned = firstMessage.replace(/[?!.,]/g, '').trim();
        if (cleaned.length <= 40) return cleaned;
        return cleaned.substring(0, 37) + '...';
    }
}

// Export singleton instance
export const angelAiApi = new AngelAIApiClient();
export default angelAiApi;

