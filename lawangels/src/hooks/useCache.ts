/**
 * Simple SWR-like hook for client-side caching with stale-while-revalidate.
 * 
 * Features:
 * - Returns cached data immediately while revalidating in background
 * - Automatic revalidation on window focus
 * - Configurable cache TTL
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface UseCacheOptions {
    /** Time in milliseconds before cache is considered stale (default: 30000 = 30 seconds) */
    maxAge?: number;
    /** Revalidate on window focus (default: true) */
    revalidateOnFocus?: boolean;
    /** Revalidate on mount even if cache exists (default: false) */
    revalidateOnMount?: boolean;
}

interface UseCacheResult<T> {
    data: T | null;
    isLoading: boolean;
    isValidating: boolean;
    error: Error | null;
    mutate: (data?: T) => void;
    refresh: () => Promise<void>;
}

// In-memory cache store
const cache: Map<string, CacheEntry<unknown>> = new Map();

export function useCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UseCacheOptions = {}
): UseCacheResult<T> {
    const {
        maxAge = 30000, // 30 seconds default
        revalidateOnFocus = true,
        revalidateOnMount = false,
    } = options;

    const [data, setData] = useState<T | null>(() => {
        const cached = cache.get(key) as CacheEntry<T> | undefined;
        return cached?.data ?? null;
    });
    const [isLoading, setIsLoading] = useState(!cache.has(key));
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const revalidate = useCallback(async () => {
        setIsValidating(true);
        try {
            const newData = await fetcherRef.current();
            cache.set(key, { data: newData, timestamp: Date.now() });
            setData(newData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch'));
        } finally {
            setIsValidating(false);
            setIsLoading(false);
        }
    }, [key]);

    // Initial fetch or revalidation
    useEffect(() => {
        const cached = cache.get(key) as CacheEntry<T> | undefined;
        const isStale = !cached || Date.now() - cached.timestamp > maxAge;

        if (cached?.data) {
            setData(cached.data);
            setIsLoading(false);
        }

        if (isStale || revalidateOnMount) {
            revalidate();
        }
    }, [key, maxAge, revalidateOnMount, revalidate]);

    // Revalidate on window focus
    useEffect(() => {
        if (!revalidateOnFocus) return;

        const handleFocus = () => {
            const cached = cache.get(key) as CacheEntry<T> | undefined;
            const isStale = !cached || Date.now() - cached.timestamp > maxAge;
            if (isStale) {
                revalidate();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [key, maxAge, revalidateOnFocus, revalidate]);

    // Manual mutation
    const mutate = useCallback((newData?: T) => {
        if (newData !== undefined) {
            cache.set(key, { data: newData, timestamp: Date.now() });
            setData(newData);
        } else {
            revalidate();
        }
    }, [key, revalidate]);

    return {
        data,
        isLoading,
        isValidating,
        error,
        mutate,
        refresh: revalidate,
    };
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheKey(key: string): void {
    cache.delete(key);
}

/**
 * Pre-populate cache with data (useful for SSR or initial data)
 */
export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

export default useCache;
