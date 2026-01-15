/**
 * Billing API Client
 * 
 * API client for Stripe subscription management.
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

export interface SubscriptionStatus {
    status: 'active' | 'past_due' | 'cancelled' | 'expired' | 'grandfathered';
    is_valid: boolean;
    current_period_end: string | null;
    days_until_expiry: number;
    stripe_customer_id: string | null;
    is_grandfathered: boolean;
}

export interface CheckoutResponse {
    checkout_url: string;
}

export interface PortalResponse {
    portal_url: string;
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

class BillingApiClient {
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
     * Get current subscription status
     */
    async getStatus(): Promise<SubscriptionStatus> {
        return this.request<SubscriptionStatus>('/billing/status/');
    }

    /**
     * Create a Stripe Checkout session for new subscription
     */
    async createCheckoutSession(): Promise<string> {
        const successUrl = `${window.location.origin}/billing?success=true`;
        const cancelUrl = `${window.location.origin}/billing?cancelled=true`;

        const response = await this.request<CheckoutResponse>('/billing/create-checkout-session/', {
            method: 'POST',
            body: JSON.stringify({
                success_url: successUrl,
                cancel_url: cancelUrl
            }),
        });

        return response.checkout_url;
    }

    /**
     * Create a Stripe Customer Portal session for managing subscription
     */
    async createPortalSession(): Promise<string> {
        const returnUrl = `${window.location.origin}/billing`;

        const response = await this.request<PortalResponse>('/billing/create-portal-session/', {
            method: 'POST',
            body: JSON.stringify({ return_url: returnUrl }),
        });

        return response.portal_url;
    }

    /**
     * Redirect to Stripe Checkout
     */
    async redirectToCheckout(): Promise<void> {
        const checkoutUrl = await this.createCheckoutSession();
        window.location.href = checkoutUrl;
    }

    /**
     * Redirect to Stripe Customer Portal
     */
    async redirectToPortal(): Promise<void> {
        const portalUrl = await this.createPortalSession();
        window.location.href = portalUrl;
    }

    /**
     * Sync subscription status from Stripe
     * Call this after successful checkout to immediately reflect payment
     */
    async syncSubscription(): Promise<{ synced: boolean; status?: string; is_valid?: boolean }> {
        return this.request<{ synced: boolean; status?: string; is_valid?: boolean }>('/billing/sync-subscription/', {
            method: 'POST',
        });
    }
}

// Export singleton instance
export const billingApi = new BillingApiClient();
export default billingApi;
