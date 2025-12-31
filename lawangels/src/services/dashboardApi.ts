/**
 * Dashboard API Service
 * Provides aggregated data for the dashboard and related pages
 * Optimized to minimize API calls by caching and batching
 */

import { quizApi, type ExamAttempt, type Exam } from './quizApi'

export interface UserStats {
    totalExams: number
    completedExams: number
    averageScore: number
    totalTimeSpentMinutes: number
    currentStreak: number
    lastActiveDate: string | null
    passRate: number
}

export interface RecentActivity {
    id: number
    type: 'exam_completed' | 'exam_started' | 'quiz_passed' | 'quiz_failed'
    title: string
    description: string
    date: string
    score?: number
    passed?: boolean
}

export interface ProgressData {
    subject: string
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    averageScore: number
    lastAttemptDate: string | null
}

export interface DashboardData {
    userStats: UserStats
    recentActivity: RecentActivity[]
    progressBySubject: ProgressData[]
    upcomingExams: Exam[]
}

// Cache for dashboard data to avoid redundant requests
interface CacheEntry<T> {
    data: T
    timestamp: number
}

const CACHE_TTL = 30000 // 30 seconds cache

class DashboardApiClient {
    private attemptsCache: CacheEntry<ExamAttempt[]> | null = null
    private examsCache: CacheEntry<Exam[]> | null = null

    /**
     * Get cached attempts or fetch fresh
     */
    private async getCachedAttempts(): Promise<ExamAttempt[]> {
        const now = Date.now()
        if (this.attemptsCache && (now - this.attemptsCache.timestamp) < CACHE_TTL) {
            return this.attemptsCache.data
        }
        const attempts = await quizApi.getAttempts()
        this.attemptsCache = { data: attempts, timestamp: now }
        return attempts
    }

    /**
     * Get cached exams or fetch fresh
     */
    private async getCachedExams(): Promise<Exam[]> {
        const now = Date.now()
        if (this.examsCache && (now - this.examsCache.timestamp) < CACHE_TTL) {
            return this.examsCache.data
        }
        const exams = await quizApi.getExams()
        this.examsCache = { data: exams, timestamp: now }
        return exams
    }

    /**
     * Invalidate cache (call after actions that modify data)
     */
    invalidateCache(): void {
        this.attemptsCache = null
        this.examsCache = null
    }

    /**
     * Calculate user statistics from exam attempts (uses cache)
     */
    async getUserStats(): Promise<UserStats> {
        try {
            const attempts = await this.getCachedAttempts()
            return this.calculateStatsFromAttempts(attempts)
        } catch (error) {
            console.error('Error fetching user stats:', error)
            return this.getDefaultStats()
        }
    }

    /**
     * Pure calculation function - no API calls
     */
    private calculateStatsFromAttempts(attempts: ExamAttempt[]): UserStats {
        const completedAttempts = attempts.filter(a => a.status === 'completed')

        // Calculate average score
        const scores = completedAttempts
            .map(a => a.score)
            .filter((s): s is number => s !== null && s !== undefined)
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0

        // Calculate total time spent
        const totalTimeSpentSeconds = completedAttempts
            .map(a => a.time_spent_seconds || 0)
            .reduce((a, b) => a + b, 0)

        // Calculate pass rate (assuming 70% is passing)
        const passedAttempts = scores.filter(s => s >= 70).length
        const passRate = scores.length > 0
            ? Math.round((passedAttempts / scores.length) * 100)
            : 0

        // Get last active date
        const sortedAttempts = [...attempts].sort(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )
        const lastActiveDate = sortedAttempts.length > 0
            ? sortedAttempts[0].started_at
            : null

        // Calculate streak
        const streak = this.calculateStreak(attempts)

        return {
            totalExams: attempts.length,
            completedExams: completedAttempts.length,
            averageScore,
            totalTimeSpentMinutes: Math.round(totalTimeSpentSeconds / 60),
            currentStreak: streak,
            lastActiveDate,
            passRate,
        }
    }

    private getDefaultStats(): UserStats {
        return {
            totalExams: 0,
            completedExams: 0,
            averageScore: 0,
            totalTimeSpentMinutes: 0,
            currentStreak: 0,
            lastActiveDate: null,
            passRate: 0,
        }
    }

    /**
     * Calculate current study streak based on exam attempts
     */
    private calculateStreak(attempts: ExamAttempt[]): number {
        if (attempts.length === 0) return 0

        const dates = attempts
            .map(a => new Date(a.started_at).toDateString())
            .filter((date, index, arr) => arr.indexOf(date) === index)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 0; i < dates.length; i++) {
            const attemptDate = new Date(dates[i])
            attemptDate.setHours(0, 0, 0, 0)

            const expectedDate = new Date(today)
            expectedDate.setDate(expectedDate.getDate() - i)

            if (attemptDate.getTime() === expectedDate.getTime()) {
                streak++
            } else if (i === 0 && attemptDate.getTime() === new Date(today.getTime() - 86400000).getTime()) {
                streak++
            } else {
                break
            }
        }

        return streak
    }

    /**
     * Get recent activity from exam attempts (uses cache)
     */
    async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
        try {
            const attempts = await this.getCachedAttempts()
            return this.extractRecentActivity(attempts, limit)
        } catch (error) {
            console.error('Error fetching recent activity:', error)
            return []
        }
    }

    /**
     * Pure function to extract recent activity from attempts
     */
    private extractRecentActivity(attempts: ExamAttempt[], limit: number): RecentActivity[] {
        const activities: RecentActivity[] = []

        // Sort by date descending
        const sortedAttempts = [...attempts].sort(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )

        for (const attempt of sortedAttempts.slice(0, limit * 2)) {
            const examTitle = attempt.exam?.title || `Exam #${attempt.exam_id}`
            const passed = attempt.score !== null && attempt.score >= 70

            if (attempt.status === 'completed') {
                activities.push({
                    id: attempt.id,
                    type: passed ? 'quiz_passed' : 'quiz_failed',
                    title: examTitle,
                    description: `Scored ${attempt.score}% on ${examTitle}`,
                    date: attempt.ended_at || attempt.started_at,
                    score: attempt.score || 0,
                    passed,
                })
            } else if (attempt.status === 'in_progress') {
                activities.push({
                    id: attempt.id,
                    type: 'exam_started',
                    title: examTitle,
                    description: `Started ${examTitle}`,
                    date: attempt.started_at,
                })
            }

            if (activities.length >= limit) break
        }

        return activities
    }

    /**
     * Get progress data grouped by subject (uses cache)
     */
    async getProgressBySubject(): Promise<ProgressData[]> {
        try {
            const [exams, attempts] = await Promise.all([
                this.getCachedExams(),
                this.getCachedAttempts(),
            ])

            return this.calculateProgressBySubject(exams, attempts)
        } catch (error) {
            console.error('Error fetching progress by subject:', error)
            return []
        }
    }

    private calculateProgressBySubject(exams: Exam[], attempts: ExamAttempt[]): ProgressData[] {
        const subjectMap = new Map<string, {
            totalQuestions: number
            answers: Array<{ isCorrect: boolean; date: string }>
        }>()

        for (const attempt of attempts) {
            if (attempt.status !== 'completed') continue

            const exam = exams.find(e => e.id === attempt.exam_id) || attempt.exam
            if (!exam) continue

            const subject = exam.subject || 'mixed'

            if (!subjectMap.has(subject)) {
                subjectMap.set(subject, {
                    totalQuestions: 0,
                    answers: [],
                })
            }

            const data = subjectMap.get(subject)!
            data.totalQuestions += exam.total_questions

            if (attempt.score !== null) {
                data.answers.push({
                    isCorrect: true,
                    date: attempt.ended_at || attempt.started_at,
                })
            }
        }

        const progressData: ProgressData[] = []

        for (const [subject, data] of subjectMap) {
            const correctAnswers = data.answers.filter(a => a.isCorrect).length
            const incorrectAnswers = data.answers.length - correctAnswers
            const averageScore = data.answers.length > 0
                ? Math.round((correctAnswers / data.answers.length) * 100)
                : 0

            const lastAnswer = data.answers.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0]

            progressData.push({
                subject: this.formatSubjectName(subject),
                totalQuestions: data.totalQuestions,
                answeredQuestions: data.answers.length,
                correctAnswers,
                incorrectAnswers,
                averageScore,
                lastAttemptDate: lastAnswer?.date || null,
            })
        }

        return progressData
    }

    private formatSubjectName(subject: string): string {
        const subjectNames: Record<string, string> = {
            'land_law': 'Land Law',
            'trusts': 'Trusts & Equity',
            'property': 'Property Transactions',
            'criminal': 'Criminal Law',
            'commercial': 'Commercial Law',
            'tax': 'Tax Law',
            'professional': 'Professional Conduct',
            'wills': 'Wills & Administration',
            'mixed': 'Mixed',
        }
        return subjectNames[subject] || subject
    }

    /**
     * Get all dashboard data in ONE efficient API call
     * Uses the new optimized /dashboard/ endpoint
     * This is the recommended method for loading the dashboard
     */
    async getDashboardData(): Promise<DashboardData> {
        try {
            // Single optimized API call - returns all data at once
            const response = await fetch(`${this.getApiBaseUrl()}/dashboard/`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.getAuthHeaders()),
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()

            // Transform response to match our DashboardData interface
            return {
                userStats: {
                    totalExams: data.userStats.totalExams,
                    completedExams: data.userStats.completedExams,
                    averageScore: data.userStats.averageScore,
                    totalTimeSpentMinutes: data.userStats.totalTimeSpentMinutes,
                    currentStreak: data.userStats.currentStreak,
                    lastActiveDate: data.userStats.lastActiveDate,
                    passRate: data.userStats.passRate,
                },
                recentActivity: data.recentActivity.map((a: any) => ({
                    id: a.id,
                    type: a.type,
                    title: a.title,
                    description: a.description,
                    date: a.date,
                    score: a.score,
                    passed: a.passed,
                })),
                progressBySubject: [], // Not used in current dashboard
                upcomingExams: data.upcomingExams,
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // Fallback to cached/old method
            return this.getDashboardDataFallback()
        }
    }

    /**
     * Fallback method using the old approach (for backwards compatibility)
     */
    private async getDashboardDataFallback(): Promise<DashboardData> {
        const [attempts, exams] = await Promise.all([
            this.getCachedAttempts(),
            this.getCachedExams(),
        ])

        const userStats = this.calculateStatsFromAttempts(attempts)
        const recentActivity = this.extractRecentActivity(attempts, 5)
        const progressBySubject = this.calculateProgressBySubject(exams, attempts)
        const upcomingExams = exams.filter(e => e.is_active).slice(0, 3)

        return {
            userStats,
            recentActivity,
            progressBySubject,
            upcomingExams,
        }
    }

    private getApiBaseUrl(): string {
        if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL
        }
        const hostname = window.location.hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000/api'
        }
        return 'https://quiz-backend.onrender.com/api'
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('authToken')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        const csrfToken = this.getCsrfToken()
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken
        }
        return headers
    }

    private getCsrfToken(): string | null {
        const name = 'csrftoken'
        let cookieValue = null
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';')
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim()
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                    break
                }
            }
        }
        return cookieValue
    }

    /**
     * Get exam attempts with exam details (uses cache)
     */
    async getExamAttemptsWithDetails(): Promise<ExamAttempt[]> {
        try {
            const [attempts, exams] = await Promise.all([
                this.getCachedAttempts(),
                this.getCachedExams(),
            ])

            return attempts.map(attempt => ({
                ...attempt,
                exam: exams.find(e => e.id === attempt.exam_id) || attempt.exam,
            }))
        } catch (error) {
            console.error('Error fetching exam attempts with details:', error)
            return []
        }
    }
}

// Export singleton instance
export const dashboardApi = new DashboardApiClient()
