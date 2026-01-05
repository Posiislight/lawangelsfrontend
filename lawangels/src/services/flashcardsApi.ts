/**
 * Flashcards API Service
 * 
 * Handles API requests for flashcard decks, cards, and user progress.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    return `${API_BASE_URL}/api`;
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
     * Get decks grouped by subject/topic
     */
    async getTopics(): Promise<FlashcardTopic[]> {
        const decks = await this.getDecks();

        // Group decks by subject
        const topicMap = new Map<string, FlashcardTopic>();

        for (const deck of decks) {
            if (!topicMap.has(deck.subject)) {
                topicMap.set(deck.subject, {
                    subject: deck.subject,
                    category: deck.category,
                    icon: deck.icon,
                    totalDecks: 0,
                    totalCards: 0,
                    decks: [],
                });
            }

            const topic = topicMap.get(deck.subject)!;
            topic.decks.push(deck);
            topic.totalDecks += 1;
            topic.totalCards += deck.total_cards;
        }

        return Array.from(topicMap.values());
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
