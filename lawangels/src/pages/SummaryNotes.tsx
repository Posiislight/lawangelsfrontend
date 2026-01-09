import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FileText, Loader2, BookOpen, CheckCircle, Library,
    Briefcase, Scale, Lock, Gavel, Handshake, Home,
    Calculator, ClipboardList, Landmark, ScrollText,
    Building, AlertTriangle, Shield, FileSignature,
    type LucideIcon
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { summaryNotesApi, type SummaryNotes } from '../services/summaryNotesApi'

// Brand colors
const FLK1_COLOR = '#0AB5FF'
const FLK2_COLOR = '#E35C02'

// Subject to icon mapping
const SUBJECT_ICONS: Record<string, LucideIcon> = {
    'Business Law': Briefcase,
    'Constitutional Law': Scale,
    'Criminal Law': Lock,
    'Criminal Practice': Gavel,
    'Dispute Resolution': Handshake,
    'Land Law': Home,
    'Solicitors Accounts': Calculator,
    'Legal Services': ClipboardList,
    'Legal System': Landmark,
    'Ethics': ScrollText,
    'Property Practice': Building,
    'Torts': AlertTriangle,
    'Trusts': Shield,
    'Wills': FileSignature,
}

// Get icon for a subject
const getSubjectIcon = (subject: string): LucideIcon => {
    return SUBJECT_ICONS[subject] || FileText
}

export default function SummaryNotesPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notes, setNotes] = useState<SummaryNotes[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'FLK1' | 'FLK2'>('all')

    useEffect(() => {
        const loadNotes = async () => {
            try {
                setLoading(true)
                const data = await summaryNotesApi.list()
                setNotes(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load summary notes')
            } finally {
                setLoading(false)
            }
        }
        loadNotes()
    }, [])

    const filteredNotes = categoryFilter === 'all'
        ? notes
        : notes.filter(n => n.category === categoryFilter)

    const handleNotesClick = (notesItem: SummaryNotes) => {
        navigate(`/summary-notes/${notesItem.id}`)
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Try again
                    </button>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between gap-8">
                    <div>
                        <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-teal-500" />
                            Summary Notes
                        </h1>
                        <p className="text-gray-600">Concise summaries for quick revision and exam prep</p>
                    </div>

                    <div className="flex-1 flex justify-center">
                        <div className="relative w-80">
                            <input
                                type="text"
                                placeholder="Search notes..."
                                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                        {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="p-8">
                {/* Category Filter */}
                <div className="flex items-center gap-2 mb-8">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        style={{
                            backgroundColor: categoryFilter === 'all' ? '#0F172B' : '#F3F4F6',
                            color: categoryFilter === 'all' ? 'white' : '#4B5563'
                        }}
                    >
                        <Library className="w-4 h-4" />
                        All Notes
                    </button>
                    <button
                        onClick={() => setCategoryFilter('FLK1')}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        style={{
                            backgroundColor: categoryFilter === 'FLK1' ? FLK1_COLOR : `${FLK1_COLOR}15`,
                            color: categoryFilter === 'FLK1' ? 'white' : FLK1_COLOR
                        }}
                    >
                        <BookOpen className="w-4 h-4" />
                        FLK1
                    </button>
                    <button
                        onClick={() => setCategoryFilter('FLK2')}
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        style={{
                            backgroundColor: categoryFilter === 'FLK2' ? FLK2_COLOR : `${FLK2_COLOR}15`,
                            color: categoryFilter === 'FLK2' ? 'white' : FLK2_COLOR
                        }}
                    >
                        <BookOpen className="w-4 h-4" />
                        FLK2
                    </button>
                </div>

                {/* Notes Grid */}
                {filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredNotes.map((notesItem) => {
                            const accentColor = notesItem.category === 'FLK1' ? FLK1_COLOR : FLK2_COLOR
                            const isCompleted = notesItem.progress_percentage === 100
                            const IconComponent = getSubjectIcon(notesItem.subject)

                            return (
                                <div
                                    key={notesItem.id}
                                    onClick={() => handleNotesClick(notesItem)}
                                    className="rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    {/* Color Bar */}
                                    <div className="h-2" style={{ backgroundColor: accentColor }} />

                                    <div className="p-5">
                                        {/* Icon and Title */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${accentColor}15` }}
                                            >
                                                <IconComponent className="w-6 h-6" style={{ color: accentColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{notesItem.title}</h3>
                                                <span
                                                    className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1"
                                                    style={{
                                                        backgroundColor: `${accentColor}15`,
                                                        color: accentColor
                                                    }}
                                                >
                                                    {notesItem.category}
                                                </span>
                                            </div>
                                            {isCompleted && (
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Chapters</span>
                                                <span className="font-medium text-gray-900">
                                                    {notesItem.chapters_completed}/{notesItem.total_chapters}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${notesItem.progress_percentage}%`,
                                                        backgroundColor: isCompleted ? '#22C55E' : accentColor
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            className="w-full text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            {notesItem.chapters_completed > 0 ? 'Continue Reading' : 'Start Reading'}
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No summary notes found</p>
                        <p className="text-gray-500">Check back later for more content</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
