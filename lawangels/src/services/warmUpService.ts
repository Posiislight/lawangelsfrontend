/**
 * Backend Warm-Up Service
 * 
 * Pings the backend on app load to wake it up from Render's cold start.
 * This reduces perceived latency for the user.
 */

const BACKEND_URL = import.meta.env.VITE_API_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : 'https://quiz-backend.onrender.com/api');

let isWarmingUp = false;
let isBackendReady = false;

/**
 * Ping the backend health endpoint to wake it up
 * Returns true if backend is awake, false if still cold starting
 */
export async function warmUpBackend(): Promise<boolean> {
    if (isBackendReady) return true;
    if (isWarmingUp) return false;

    isWarmingUp = true;
    console.log('[WarmUp] Pinging backend to wake up...');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${BACKEND_URL}/health/`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            isBackendReady = true;
            console.log('[WarmUp] Backend is ready!');
            return true;
        }
    } catch (error) {
        // Backend still cold starting - retry silently
        console.log('[WarmUp] Backend still starting...');
    } finally {
        isWarmingUp = false;
    }

    return false;
}

/**
 * Keep trying to warm up the backend
 * Useful for showing a loading state while backend wakes up
 */
export async function waitForBackend(maxWaitMs = 45000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        if (await warmUpBackend()) {
            return true;
        }
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
}

/**
 * Check if backend is currently ready (without making a request)
 */
export function isReady(): boolean {
    return isBackendReady;
}

/**
 * Reset the ready state (useful after long inactivity)
 */
export function resetReadyState(): void {
    isBackendReady = false;
}
