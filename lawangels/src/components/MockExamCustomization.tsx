import { useState } from 'react'
import { ArrowLeft, Check, AlertCircle, ArrowRight, FileX } from 'lucide-react'
import type { Exam } from '../services/quizApi'

export type PracticeMode = 'real-exam' | 'learn-as-you-go'

interface MockExamCustomizationProps {
    exam: Exam
    onContinue: (settings: { practiceMode: PracticeMode; extraTimeEnabled: boolean }) => void
    onBack: () => void
    hasSavedProgress?: boolean
    onResetProgress?: () => void
}

export default function MockExamCustomization({
    exam,
    onContinue,
    onBack,
    hasSavedProgress = false,
    onResetProgress
}: MockExamCustomizationProps) {
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('real-exam')
    const [extraTimeEnabled, setExtraTimeEnabled] = useState(false)
    const [showNewExamOptions, setShowNewExamOptions] = useState(!hasSavedProgress)

    const handleContinue = () => {
        onContinue({ practiceMode, extraTimeEnabled })
    }

    const handleStartNew = () => {
        if (onResetProgress) onResetProgress()
        setShowNewExamOptions(true)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-[#0F172B] border-b border-[#1D293D] shadow-lg z-50">
                <div className="flex items-center px-10 py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-3 bg-transparent text-[#CAD5E2] hover:text-white transition"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-24 px-4 sm:px-8 md:px-16 max-w-3xl mx-auto pb-8">
                {/* Title */}
                <div className="text-center mb-10">
                    <div className="inline-block bg-[#E17100] text-white px-4 py-2 rounded-lg text-xs font-medium mb-4">
                        {exam.title}
                    </div>
                    <h1 className="text-2xl font-medium text-[#0F172B] mb-2">
                        {hasSavedProgress && !showNewExamOptions ? 'Resume Your Exam' : "Choose How You'd Like to Practice"}
                    </h1>
                    <p className="text-base text-[#45556C]">
                        {hasSavedProgress && !showNewExamOptions
                            ? 'You have an exam in progress. Would you like to continue where you left off?'
                            : 'Pick the practice style that works best for you today'}
                    </p>
                </div>

                {/* Resume Options */}
                {hasSavedProgress && !showNewExamOptions ? (
                    <div className="space-y-4 mb-8">
                        <button
                            onClick={handleContinue}
                            className="w-full p-6 rounded-xl border-2 border-[#E17100] bg-[#FFF7ED] hover:bg-[#FFEAD0] transition-all text-left group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#9A3412] mb-1">
                                        Continue Previous Session
                                    </h3>
                                    <p className="text-sm text-[#9A3412] opacity-80">
                                        Pick up exactly where you left off
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#E17100] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleStartNew}
                            className="w-full p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-3 text-gray-600">
                                <FileX size={18} />
                                <span className="font-medium">Discard progress and start new exam</span>
                            </div>
                        </button>
                    </div>
                ) : (
                    /* Practice Mode Selection */
                    <div className="space-y-4 mb-8">
                        {/* Real Exam Mode */}
                        <button
                            onClick={() => setPracticeMode('real-exam')}
                            className={`w-full text-left p-6 rounded-xl border-2 transition-all ${practiceMode === 'real-exam'
                                ? 'border-[#0EA5E9] bg-[#F0F9FF]'
                                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${practiceMode === 'real-exam'
                                    ? 'border-[#0EA5E9] bg-[#0EA5E9]'
                                    : 'border-[#CBD5E1]'
                                    }`}>
                                    {practiceMode === 'real-exam' && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#0F172B] mb-2">
                                        Practice Like the Real Exam
                                    </h3>
                                    <p className="text-sm text-[#45556C] mb-3">
                                        Answer all questions first, then see your results at the end.
                                    </p>
                                    <ul className="space-y-1.5">
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            No answers shown during the test
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            Full results and explanations at the end
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            Best for exam preparation
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </button>

                        {/* Learn as You Go Mode */}
                        <button
                            onClick={() => setPracticeMode('learn-as-you-go')}
                            className={`w-full text-left p-6 rounded-xl border-2 transition-all ${practiceMode === 'learn-as-you-go'
                                ? 'border-[#0EA5E9] bg-[#F0F9FF]'
                                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${practiceMode === 'learn-as-you-go'
                                    ? 'border-[#0EA5E9] bg-[#0EA5E9]'
                                    : 'border-[#CBD5E1]'
                                    }`}>
                                    {practiceMode === 'learn-as-you-go' && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#0F172B] mb-2">
                                        Learn as You Go
                                    </h3>
                                    <p className="text-sm text-[#45556C] mb-3">
                                        See the correct answer and explanation right after each question.
                                    </p>
                                    <ul className="space-y-1.5">
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            Instant feedback after each answer
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            Timer pauses while you read explanations
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-[#45556C]">
                                            <span className="text-[#45556C]">•</span>
                                            Best for learning new material
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Good to Know Section */}
                <div className="border-l-4 border-[#E2E8F0] bg-[#F8FAFC] rounded-r-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-[#0F172B] mb-4">Good to Know</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Check size={18} className="text-[#10B981] mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-[#45556C]">Both modes have the same questions</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check size={18} className="text-[#10B981] mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-[#45556C]">You can pause and restart the timer anytime</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check size={18} className="text-[#10B981] mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-[#45556C]">You can keep going even after time runs out</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <AlertCircle size={18} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-[#45556C]">Remember: In the real exam, you can't pause or get extra time</span>
                        </li>
                    </ul>
                </div>

                {/* Extra Time Section */}
                <div className={`rounded-xl p-6 mb-8 transition-all ${extraTimeEnabled
                    ? 'border-2 border-[#0EA5E9] bg-[#F0F9FF]'
                    : 'border-2 border-[#E2E8F0] bg-white'
                    }`}>
                    <h3 className="text-lg font-semibold text-[#0F172B] mb-4">
                        {extraTimeEnabled ? 'Need Extra Time?' : 'Do You Need Extra Time?'}
                    </h3>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative mt-0.5">
                            <input
                                type="checkbox"
                                checked={extraTimeEnabled}
                                onChange={(e) => setExtraTimeEnabled(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${extraTimeEnabled
                                ? 'bg-[#0EA5E9] border-[#0EA5E9]'
                                : 'bg-white border-[#CBD5E1]'
                                }`}>
                                {extraTimeEnabled && <Check size={14} className="text-white" />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[#0F172B]">
                                Yes, I have approved extra time accommodations
                            </p>
                            <p className="text-sm text-[#45556C] mt-1">
                                This will give you 25% more time on your practice test, matching your official exam accommodations
                            </p>
                            {extraTimeEnabled && (
                                <p className="text-sm text-[#0EA5E9] mt-2 font-medium flex items-center gap-1">
                                    <Check size={14} />
                                    Extra time has been added to your practice session
                                </p>
                            )}
                        </div>
                    </label>
                </div>

                {/* Continue Button */}
                {(!hasSavedProgress || showNewExamOptions) && (
                    <div className="flex justify-center">
                        <button
                            onClick={handleContinue}
                            className="bg-[#0EA5E9] text-white px-12 py-3 rounded-lg font-medium hover:bg-[#0284C7] transition text-lg"
                        >
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
