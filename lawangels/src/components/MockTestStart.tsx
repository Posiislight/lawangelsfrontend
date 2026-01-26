import { ArrowLeft, Clock, FileText, BookOpen, CheckCircle, Zap } from 'lucide-react'
import type { Exam } from '../services/quizApi'

interface MockTestStartProps {
  exam: Exam
  onContinue: () => void
  onBack: () => void
}

export default function MockTestStart({ exam, onContinue, onBack }: MockTestStartProps) {
  const formatSubjectName = (subject: string): string => {
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

  const instructions = [
    'Read each question carefully and select the best answer from the options provided.',
    'You can navigate between questions using the Previous and Next buttons.',
    'Your progress will be saved automatically as you complete each question.',
    'The timer will start as soon as you begin the test.',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0F172B] border-b border-[#1D293D] shadow-lg z-50">
        <div className="flex items-center px-10 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-3 bg-[#0F172B] text-[#CAD5E2] hover:text-white transition"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Mock Exams</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-8 md:px-16 max-w-4xl mx-auto pb-8">
        {/* Badge and Heading */}
        <div className="mb-8 relative text-center">
          <div className="inline-block bg-[#E17100] text-white px-4 py-2 rounded-lg text-xs font-medium mb-6">
            {formatSubjectName(exam.subject)}
          </div>
          <h1 className="text-3xl font-medium text-[#0F172B] mb-3 text-center">{exam.title}</h1>
          <p className="text-base text-[#45556C] max-w-2xl text-center mx-auto">
            {exam.description || `Test your knowledge with professionally designed questions covering ${formatSubjectName(exam.subject)}. This mock test simulates real exam conditions to help you prepare effectively.`}
          </p>
        </div>

        {/* Test Overview Card */}
        <div className="bg-white border border-[#DEDEDE] rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-medium text-[#0F172B] mb-8">Test Overview</h2>

          {/* Overview Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Duration */}
            <div className="flex gap-4">
              <div className="bg-[#F1F5F9] rounded-xl p-3 h-fit">
                <Clock size={24} className="text-[#314158]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#0F172B]">Duration</h3>
                <p className="text-base text-[#45556C]">{exam.duration_minutes} minutes</p>
              </div>
            </div>

            {/* Questions */}
            <div className="flex gap-4">
              <div className="bg-[#F1F5F9] rounded-xl p-3 h-fit">
                <FileText size={24} className="text-[#314158]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#0F172B]">Questions</h3>
                <p className="text-base text-[#45556C]">{exam.total_questions} multiple choice questions</p>
              </div>
            </div>

            {/* Subject Area */}
            <div className="flex gap-4">
              <div className="bg-[#F1F5F9] rounded-xl p-3 h-fit">
                <BookOpen size={24} className="text-[#314158]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#0F172B]">Subject Area</h3>
                <p className="text-base text-[#45556C]">{formatSubjectName(exam.subject)}</p>
              </div>
            </div>

            {/* Pass Mark */}
            <div className="flex gap-4">
              <div className="bg-[#F1F5F9] rounded-xl p-3 h-fit">
                <CheckCircle size={24} className="text-[#314158]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#0F172B]">Pass Mark</h3>
                <p className="text-base text-[#45556C]">
                  {exam.passing_score_percentage}% ({Math.round(exam.total_questions * exam.passing_score_percentage / 100)}/{exam.total_questions} questions)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-[#F8FAFC] rounded-xl p-6 mb-8">
          <h3 className="text-base font-medium text-[#0F172B] mb-4">Instructions</h3>
          <ol className="space-y-3">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex items-center justify-center min-w-6 h-6 rounded-full bg-[#0F172B] text-white text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-base text-[#314158] pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Speed Reader Mode Alert */}
        <div className="bg-[#FFFBEB] border-2 border-[#FEE685] rounded-xl p-6 mb-8">
          <div className="flex gap-3 mb-3">
            <Zap size={24} className="text-[#E17100] flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-[#7B3306] mb-2">Speed Reader Mode</h3>
              <p className="text-base text-[#973C00]">
                Enable Speed Reader mode to practice under timed conditions. Each question will auto-advance after 60 seconds, helping you improve your time management skills.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onContinue}
            className="bg-[#0F172B] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#1a1f3a] transition flex items-center gap-2 text-lg"
          >
            <span className="text-xl">▶</span>
            Continue
          </button>
          <p className="text-sm text-[#62748E] text-center">
            Make sure you have a stable internet connection and uninterrupted time to complete the test.
          </p>
        </div>
      </div>
    </div>
  )
}
