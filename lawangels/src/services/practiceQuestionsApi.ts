/**
 * Practice Questions API Service
 * 
 * Handles fetching practice questions organized by course and topic.
 */
import apiClient from '../api/client'

export interface QuestionOption {
    label: string
    text: string
}

export interface PracticeQuestion {
    id: number
    title?: string
    text: string
    options: QuestionOption[]
    correct_answer: string
    explanation: string
    difficulty: string
}

export interface PracticeArea {
    letter: string
    name: string
    slug: string
    question_count: number
    questions?: PracticeQuestion[]
}

export interface PracticeTopic {
    name: string
    slug: string
    area_count?: number
    question_count: number
    areas?: PracticeArea[]
}

export interface PracticeCourse {
    name: string
    slug: string
    topic_count: number
    question_count: number
    topics: PracticeTopic[]
}

export interface PracticeQuestionsListResponse {
    courses: PracticeCourse[]
    total_courses: number
    total_topics: number
    total_questions: number
}

export interface CourseTopicsResponse {
    course: {
        name: string
        slug: string
    }
    topics: PracticeTopic[]
    total_questions: number
}

export interface TopicQuestionsResponse {
    course: {
        name: string
        slug: string
    }
    topic: {
        name: string
        slug: string
    }
    questions: PracticeQuestion[]
    total_questions: number
}

/**
 * Fetch all courses with their topics and question counts
 */
export async function getCourses(): Promise<PracticeQuestionsListResponse> {
    const response = await apiClient.get('/practice-questions/')
    return response.data
}

/**
 * Fetch topics for a specific course
 */
export async function getCourseTopics(courseSlug: string): Promise<CourseTopicsResponse> {
    const response = await apiClient.get(`/practice-questions/${courseSlug}/`)
    return response.data
}

/**
 * Fetch questions for a specific topic
 */
export async function getTopicQuestions(courseSlug: string, topicSlug: string): Promise<TopicQuestionsResponse> {
    const response = await apiClient.get(`/practice-questions/${courseSlug}/${topicSlug}/`)
    return response.data
}

export const practiceQuestionsApi = {
    getCourses,
    getCourseTopics,
    getTopicQuestions,
}
