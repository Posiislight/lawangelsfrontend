/**
 * Dashboard API Service
 * Provides aggregated data for the dashboard and related pages
 * Uses existing quizApi endpoints and calculates statistics
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

class DashboardApiClient {
    /**
     * Calculate user statistics from exam attempts
     */
    async getUserStats(): Promise<UserStats> {
        try {
            const attempts = await quizApi.getAttempts()
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

            // Calculate streak (consecutive days with activity)
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
        } catch (error) {
            console.error('Error fetching user stats:', error)
            // Return default stats on error
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
                // Allow for yesterday if today hasn't been started yet
                streak++
            } else {
                break
            }
        }

        return streak
    }

    /**
     * Get recent activity from exam attempts
     */
    async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
        try {
            const attempts = await quizApi.getAttempts()

            const activities: RecentActivity[] = []

            for (const attempt of attempts.slice(0, limit * 2)) {
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
        } catch (error) {
            console.error('Error fetching recent activity:', error)
            return []
        }
    }

    /**
     * Get progress data grouped by subject
     */
    async getProgressBySubject(): Promise<ProgressData[]> {
        try {
            const [exams, attempts] = await Promise.all([
                quizApi.getExams(),
                quizApi.getAttempts(),
            ])

            // Group attempts by exam subject
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

                // Add attempt answers (simplified - we'd need to fetch actual answers for full accuracy)
                if (attempt.score !== null) {
                    // Note: For full accuracy, we'd need to fetch actual answer records
                    data.answers.push({
                        isCorrect: true,
                        date: attempt.ended_at || attempt.started_at,
                    })
                }
            }

            // Convert to progress data
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
        } catch (error) {
            console.error('Error fetching progress by subject:', error)
            return []
        }
    }

    /**
     * Format subject key to display name
     */
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
     * Get all dashboard data in one call
     */
    async getDashboardData(): Promise<DashboardData> {
        const [userStats, recentActivity, progressBySubject, upcomingExams] = await Promise.all([
            this.getUserStats(),
            this.getRecentActivity(),
            this.getProgressBySubject(),
            quizApi.getExams(),
        ])

        return {
            userStats,
            recentActivity,
            progressBySubject,
            upcomingExams: upcomingExams.filter(e => e.is_active).slice(0, 3),
        }
    }

    /**
     * Get exam attempts with exam details
     */
    async getExamAttemptsWithDetails(): Promise<ExamAttempt[]> {
        try {
            const [attempts, exams] = await Promise.all([
                quizApi.getAttempts(),
                quizApi.getExams(),
            ])

            // Enrich attempts with exam details
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
