import { useAuth } from '../contexts/AuthContext'
import { Bell, CheckCircle, Eye } from 'lucide-react'
import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

export default function SQETips() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('exam-strategy')

  const tips = {
    'exam-strategy': [
      {
        title: 'Race Against the Clock',
        category: 'Exam Strategy',
        difficulty: 'Intermediate',
        reads: 3200,
        icon: '⏱️',
        content: 'You have roughly 102 seconds (approx 1.7 mins) per question. Anything slower puts pressure on later questions. Treat the exam like a race.',
        tips: [
          'Track your pace strictly',
          'Don\'t get stuck on one question',
          'Flag uncertain answers and move on',
          '70 seconds average pace'
        ]
      },
      {
        title: 'Read the Call First',
        category: 'Exam Strategy',
        difficulty: 'Beginner',
        reads: 2800,
        icon: '📜',
        content: 'Know exactly what you’re being asked before diving into the scenario. Read the question line (the last sentence) first to frame your reading of the facts.',
        tips: [
          'Read the last sentence first',
          'Identify the specific legal issue',
          'Scan facts with the specific question in mind',
          'Avoid getting distracted by irrelevant details'
        ]
      },
      {
        title: 'Master the Interface',
        category: 'Exam Strategy',
        difficulty: 'Beginner',
        reads: 1500,
        icon: '💻',
        content: 'Familiarity with navigation, flagging, and timing reduces anxiety on the day. Know exactly how to flag questions and check your progress.',
        tips: [
          'Learn the flagging system',
          'Know how to review unanswered questions',
          'Get comfortable with the screen layout',
          'Don\'t waste time learning tools during exam'
        ]
      },
      {
        title: 'Build Endurance',
        category: 'Exam Strategy',
        difficulty: 'Advanced',
        reads: 2100,
        icon: '🏃',
        content: 'Many candidates say SQE 1 is as much an endurance exam as a knowledge test. Online exam fatigue is real. Simulate full-length sittings to build stamina.',
        tips: [
          'Simulate full 2.5 hour sessions',
          'Practice maintaining focus',
          'Don\'t just do short quizzes',
          'Build up mental stamina'
        ]
      },
      {
        title: 'Fuel Your Brain',
        category: 'Exam Strategy',
        difficulty: 'Beginner',
        reads: 1200,
        icon: '🍳',
        content: 'Low blood sugar = slower thinking. Candidates who skipped breakfast often regretted it. Eat a proper meal before the exam.',
        tips: [
          'Eat a slow-release carb breakfast',
          'Stay hydrated',
          'Avoid heavy sugar crashes',
          'Brain function requires fuel'
        ]
      }
    ],
    'common-mistakes': [
      {
        title: 'The "Reasonable Man" Trap',
        category: 'Common Mistakes',
        difficulty: 'Intermediate',
        reads: 3100,
        icon: '🧔',
        content: 'It’s a classic distractor. Only choose the "reasonable man" option if you are certain it correctly applies to the specific legal test in question. Often it is too vague.',
        tips: [
          'Be skeptical of "reasonable" options',
          'Look for specific legal tests first',
          'Check if specific case law applies',
          'Don\'t use it as a default guess'
        ]
      },
      {
        title: 'Absolute Language Red Flags',
        category: 'Common Mistakes',
        difficulty: 'Beginner',
        reads: 2900,
        icon: '🚩',
        content: 'Words like "always", "never", or "automatically" are often red flags. The law usually has exceptions. Be very suspicious of answers containing these absolutes.',
        tips: [
          'Highlight "always/never/automatically"',
          'Look for exceptions',
          'Law is rarely absolute',
          'Prefer qualified answers'
        ]
      },
      {
        title: 'Avoid Overthinking',
        category: 'Common Mistakes',
        difficulty: 'Intermediate',
        reads: 2500,
        icon: '🧠',
        content: 'Many candidates report changing correct answers because they assumed the exam was "trying to trick them." Trust your first instinct unless you clearly misread.',
        tips: [
          'Stick to your first choice',
          'Only change if you misread facts',
          'Don\'t invent traps',
          'First instinct is often subconscious knowledge'
        ]
      },
      {
        title: 'Length ≠ Correctness',
        category: 'Common Mistakes',
        difficulty: 'Beginner',
        reads: 1800,
        icon: '📏',
        content: 'Don’t assume the longest answer is correct. Concise answers are frequently the right ones. Don\'t pick an answer just because it "sounds" the most like a lawyer.',
        tips: [
          'Concise is often correct',
          'Focus on legal accuracy',
          'Ignore word count',
          'Read every option fully'
        ]
      },
      {
        title: 'Real-World Logic vs Law',
        category: 'Common Mistakes',
        difficulty: 'Intermediate',
        reads: 2200,
        icon: '🌍',
        content: 'Answer according to the law, not what feels fair or commercially sensible. Professional conduct rules often defy "common sense" business logic.',
        tips: [
          'Apply strict legal rules',
          'Ignore personal fairness',
          'Commercial sense isn\'t always legal',
          'Follow the statute/code'
        ]
      }
    ],
    'study-techniques': [
      {
        title: 'Master Key Timeframes',
        category: 'Study Techniques',
        difficulty: 'Intermediate',
        reads: 3500,
        icon: '📅',
        content: 'Limitation periods, appeal windows, notice requirements, and procedural deadlines are easy marks, but only if you’ve memorised them cold.',
        tips: [
          'Use the Key Timeframes tool',
          'Memorize exact day counts',
          'Know when periods start',
          'These are "free marks"'
        ]
      },
      {
        title: 'Accounting Entries Mantra',
        category: 'Study Techniques',
        difficulty: 'Advanced',
        reads: 2100,
        icon: '💷',
        content: 'Repetition works. If you can recite comprehensive accounting entries daily, solicitor accounting rules will stick. Make it a daily mantra.',
        tips: [
          'Recite entries daily',
          'Know Debit/Credit rules',
          'Practice writing them out',
          'Visualize the ledger movement'
        ]
      },
      {
        title: 'Active Revision',
        category: 'Study Techniques',
        difficulty: 'Beginner',
        reads: 2700,
        icon: '🔄',
        content: 'Candidates consistently say improvement came after heavy question practice, not just reading notes. Revise from questions, not just textbooks.',
        tips: [
          'Prioritize practice questions',
          'Learn from wrong answers',
          'Active recall over passive reading',
          'Simulate exam thinking'
        ]
      },
      {
        title: 'Consistency Beats Intensity',
        category: 'Study Techniques',
        difficulty: 'Intermediate',
        reads: 1900,
        icon: '📈',
        content: 'Candidates who passed often say steady daily revision outperformed last-minute cramming. A proper night’s sleep beats late-night cramming.',
        tips: [
          'Study daily in blocks',
          'Avoid burnout',
          'Sleep helps memory retention',
          'Plan long-term'
        ]
      },
      {
        title: 'Elimination Technique',
        category: 'Study Techniques',
        difficulty: 'Beginner',
        reads: 3100,
        icon: '🗑️',
        content: 'Often two options are clearly wrong. Narrowing the field to two options dramatically increases your statistical chance of accuracy.',
        tips: [
          'Cross out obvious wrongs',
          'Focus on remaining options',
          'Compare closely',
          'Increases specific accuracy'
        ]
      }
    ]
  }

  const categories = [
    { id: 'exam-strategy', label: 'Exam Strategy', count: tips['exam-strategy'].length },
    { id: 'common-mistakes', label: 'Common Mistakes', count: tips['common-mistakes'].length },
    { id: 'study-techniques', label: 'Study Techniques', count: tips['study-techniques'].length }
  ]

  const quickTips = [
    { icon: '⏱️', title: '70 Seconds', description: 'Be strict with your timing. Average 1.7 minutes per question.' },
    { icon: '🚫', title: 'Avoid Absolutes', description: 'Be wary of "always" and "never". Law loves exceptions.' },
    { icon: '🏁', title: 'Trust First Instinct', description: 'Statistically, your first choice is usually right.' },
    { icon: '🔁', title: 'Consistency', description: 'Daily steady practice beats panic cramming.' },
    { icon: '🧐', title: 'Read the Call', description: 'Read the final question sentence first.' },
    { icon: '😴', title: 'Sleep Well', description: 'Rest is crucial for recall and endurance.' }
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              💡 SQE Tips & Tricks
            </h1>
            <p className="text-gray-600">Expert advice on exam technique, avoiding common mistakes, and effective study methods</p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search tips..."
                className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-8">
        {/* Quick Tips Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-normal text-black mb-6">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickTips.map((tip, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{tip.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-700">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <h2 className="text-2xl font-normal text-black mb-4">Detailed Tips by Category</h2>
          <div className="flex gap-3 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500'
                  }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tips Cards */}
        <div className="space-y-4">
          {tips[selectedCategory as keyof typeof tips].map((tip, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{tip.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tip.title}</h3>
                      <p className="text-sm text-gray-600">{tip.category}</p>
                    </div>
                  </div>
                </div>

              </div>

              <p className="text-gray-700 mb-4">{tip.content}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Key Points:</p>
                <ul className="space-y-1">
                  {tip.tips.map((t, tidx) => (
                    <li key={tidx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {tip.reads.toLocaleString()} reads
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
