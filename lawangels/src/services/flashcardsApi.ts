/**
 * Flashcards API Service
 * 
 * Handles API requests for flashcard decks, cards, and user progress.
 */

// Get API base URL from environment variable (same as authApi uses VITE_API_URL)
const getBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
        console.log('[FlashcardsAPI] Using environment variable API URL:', envUrl);
        return envUrl;
    }
    console.log('[FlashcardsAPI] Using default localhost URL');
    return 'http://localhost:8000/api';
};

const API_BASE_URL = getBaseUrl();
console.log('[FlashcardsAPI] Initialized with base URL:', API_BASE_URL);

// Types
export interface FlashcardDeck {
    id: number;
    title: string;
    subject: string;
    category: string;
    icon: string;
    total_cards: number;
    user_progress: FlashcardProgress | null;
}

export interface FlashcardDeckDetail extends FlashcardDeck {
    description: string;
    cards: Flashcard[];
}

export interface Flashcard {
    id: number;
    question: string;
    answer: string;
    hint: string;
    order: number;
}

export interface FlashcardProgress {
    id: number;
    cards_studied: number;
    correct_answers: number;
    total_attempts: number;
    accuracy_percentage: number;
    progress_percentage: number;
    last_studied_at: string;
}

export interface StudySession {
    deck: FlashcardDeckDetail;
    cards: Flashcard[];
    progress: FlashcardProgress | null;
}

export interface FlashcardTopic {
    subject: string;
    category: string;
    icon: string;
    totalDecks: number;
    totalCards: number;
    decks: FlashcardDeck[];
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

function getApiBaseUrl() {
    return API_BASE_URL;
}

export const flashcardsApi = {
    /** 
     * Get all flashcard decks with user progress
     */
    async getDecks(): Promise<FlashcardDeck[]> {
        const response = await fetch(`${getApiBaseUrl()}/flashcards/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flashcard decks');
        }

        return await response.json();
    },

    /**
     * Get decks grouped by subject/topic - uses optimized backend endpoint
     */
    async getTopics(): Promise<FlashcardTopic[]> {
        const response = await fetch(`${getApiBaseUrl()}/flashcards/topics/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch topics');
        }

        const data = await response.json();

        // Transform backend response to match expected format
        return data.map((item: { subject: string; category: string; icon: string; total_decks: number; total_cards: number }) => ({
            subject: item.subject,
            category: item.category,
            icon: item.icon,
            totalDecks: item.total_decks,
            totalCards: item.total_cards,
            decks: [], // Decks loaded separately when needed
        }));
    },

    /**
     * Get decks for a specific subject
     */
    async getDecksBySubject(subject: string): Promise<FlashcardDeck[]> {
        const decks = await this.getDecks();
        return decks.filter(d => d.subject === subject);
    },

    /**
     * Get a specific deck with all its cards
     */
    async getDeck(deckId: number): Promise<FlashcardDeckDetail> {
        const response = await fetch(`${getApiBaseUrl()}/flashcards/${deckId}/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flashcard deck');
        }

        return await response.json();
    },

    /**
     * Get study session data (deck + cards + progress)
     */
    async getStudySession(deckId: number): Promise<StudySession> {
        const response = await fetch(`${getApiBaseUrl()}/flashcards/${deckId}/study/`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch study session');
        }

        return await response.json();
    },

    /**
     * Update progress after answering a card
     */
    async updateProgress(deckId: number, cardsStudied: number, correct: boolean): Promise<FlashcardProgress> {
        const response = await fetch(`${getApiBaseUrl()}/flashcards/${deckId}/update_progress/`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                cards_studied: cardsStudied,
                correct,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update progress');
        }

        return await response.json();
    },
};
