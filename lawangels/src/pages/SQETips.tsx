import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, Bell, Home, BarChart3, HelpCircle, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Clock, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function SQETips() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('exam-strategy')

  const tips = {
    'exam-strategy': [
      {
        title: 'Time Management During the Exam',
        category: 'Exam Strategy',
        difficulty: 'Intermediate',
        reads: 2450,
        icon: '⏱️',
        content: 'The SQE exams are timed assessments. Allocate approximately 1 minute per mark. For a 50-mark question, you should spend around 50 minutes. Practice under timed conditions to develop speed and accuracy. Leave time at the end to review your answers.',
        tips: [
          'Read all questions before starting',
          'Tackle easy questions first to build confidence',
          'Flag difficult questions and return to them',
          'Save 10 minutes for final review'
        ]
      },
      {
        title: 'Structuring Answers Effectively',
        category: 'Exam Strategy',
        difficulty: 'Intermediate',
        reads: 1890,
        icon: '📝',
        content: 'Use a clear structure: IRAC (Issue, Rule, Application, Conclusion) for problem questions and a logical flow for essay questions. State the issue clearly, explain the relevant law, apply it to the facts, and conclude.',
        tips: [
          'Use paragraph breaks to separate points',
          'Start with a clear statement of the legal issue',
          'Cite relevant case law and legislation',
          'Link each point back to the question asked'
        ]
      },
      {
        title: 'Exam Technique - Multiple Choice Questions',
        category: 'Exam Strategy',
        difficulty: 'Beginner',
        reads: 3100,
        icon: '✓',
        content: 'For MCQs: read the question carefully, identify what is being asked, eliminate obviously wrong answers first, and be cautious of options that seem too broad or contain absolutes.',
        tips: [
          'Eliminate obviously incorrect options',
          'Be wary of "all of the above" options',
          'Pay attention to words like "always", "never"',
          'Mark for review if unsure'
        ]
      },
      {
        title: 'Managing Exam Anxiety',
        category: 'Exam Strategy',
        difficulty: 'Beginner',
        reads: 2200,
        icon: '🧠',
        content: 'Anxiety is normal but manageable. Practice past papers under exam conditions, maintain a healthy sleep schedule, and use breathing techniques during the exam. Remember that you\'re aiming to pass, not to be perfect.',
        tips: [
          'Practice deep breathing (4-4-4 technique)',
          'Do timed practice papers regularly',
          'Get adequate sleep before the exam',
          'Arrive early to settle in'
        ]
      }
    ],
    'common-mistakes': [
      {
        title: 'Confusing Similar Legal Concepts',
        category: 'Common Mistakes',
        difficulty: 'Intermediate',
        reads: 1650,
        icon: '❌',
        content: 'Students often confuse conditions precedent with conditions subsequent, or misidentify when a duty of care is owed. Create flashcards distinguishing similar concepts. Use case examples to anchor the differences.',
        tips: [
          'Create comparison tables',
          'Use real case examples',
          'Test yourself regularly on distinctions',
          'Teach the concept to someone else'
        ]
      },
      {
        title: 'Ignoring the Specific Question Asked',
        category: 'Common Mistakes',
        difficulty: 'Beginner',
        reads: 2300,
        icon: '🎯',
        content: 'The most common mistake is answering a different question from the one asked. Underline key words in the question, identify what specifically is being asked, and ensure your answer directly addresses the question.',
        tips: [
          'Highlight the key words in every question',
          'Summarize what is being asked in one sentence',
          'Check that your answer directly addresses the question',
          'Avoid generic explanations'
        ]
      },
      {
        title: 'Applying Law Without Reference to Facts',
        category: 'Common Mistakes',
        difficulty: 'Intermediate',
        reads: 1920,
        icon: '🔗',
        content: 'Don\'t just state the law - apply it to the specific facts given. Examiners want to see how you analyze the given scenario using legal principles. Always bridge between the law and the facts.',
        tips: [
          'For each legal rule, apply it to the facts',
          'Use phrases like "In this case..." or "Applying this to..."',
          'Identify specific facts that are relevant',
          'Explain why certain facts matter'
        ]
      },
      {
        title: 'Not Citing Authority',
        category: 'Common Mistakes',
        difficulty: 'Beginner',
        reads: 1780,
        icon: '📚',
        content: 'Always cite the source of your legal statements - whether it\'s case law, legislation, or precedent. This demonstrates authority and strengthens your argument. Know the key leading cases for each topic.',
        tips: [
          'Learn leading cases for each topic',
          'Always cite when stating a legal principle',
          'Use correct case citation format',
          'Reference the specific section of legislation'
        ]
      }
    ],
    'study-techniques': [
      {
        title: 'Active Recall and Spaced Repetition',
        category: 'Study Techniques',
        difficulty: 'Beginner',
        reads: 2800,
        icon: '🔄',
        content: 'Rather than passive reading, use active recall: cover notes and try to remember the information. Space out your learning over time rather than cramming. This builds long-term retention. Use the 70/30 rule: 70% of time retrieving information, 30% learning new material.',
        tips: [
          'Create flashcards and test yourself daily',
          'Practice questions without looking at notes',
          'Review material at increasing intervals',
          'Teach concepts to study partners'
        ]
      },
      {
        title: 'Case Analysis Method',
        category: 'Study Techniques',
        difficulty: 'Intermediate',
        reads: 2100,
        icon: '⚖️',
        content: 'For each important case, use this structure: Facts → Issue → Decision → Reasoning → Application. This ensures you understand not just the outcome but the legal principle established.',
        tips: [
          'Create case analysis templates',
          'Study cases in context of topic',
          'Compare similar cases side by side',
          'Understand the principle, not just the outcome'
        ]
      },
      {
        title: 'Concept Mapping and Visual Learning',
        category: 'Study Techniques',
        difficulty: 'Beginner',
        reads: 1950,
        icon: '🗺️',
        content: 'Create visual maps of how legal concepts relate. For example, map the requirements for a valid contract or the different types of trusts. Visual learning helps you see the big picture and connections between topics.',
        tips: [
          'Use mind mapping software or draw by hand',
          'Color-code different concepts',
          'Show relationships between topics',
          'Review maps regularly'
        ]
      },
      {
        title: 'Practice Under Exam Conditions',
        category: 'Study Techniques',
        difficulty: 'Intermediate',
        reads: 2450,
        icon: '⏰',
        content: 'The best preparation is practicing under timed, exam-like conditions. This builds stamina, improves your speed, and reduces exam anxiety. Aim to complete at least 10 full practice exams before your SQE.',
        tips: [
          'Use official SQE sample papers',
          'Time yourself strictly',
          'Mark your answers objectively',
          'Review mistakes thoroughly'
        ]
      }
    ]
  }

  const categories = [
    { id: 'exam-strategy', label: 'Exam Strategy', count: 4 },
    { id: 'common-mistakes', label: 'Common Mistakes', count: 4 },
    { id: 'study-techniques', label: 'Study Techniques', count: 4 }
  ]

  const quickTips = [
    { icon: '📖', title: 'Read the question twice', description: 'Read questions twice - once to understand, once to ensure you understand what\'s being asked' },
    { icon: '🎯', title: 'Focus on the law being tested', description: 'Identify which area of law is being tested and what specific principle is at issue' },
    { icon: '💡', title: 'Know your key cases', description: 'Memorize landmark cases and their significance in establishing legal principles' },
    { icon: '✍️', title: 'Practice your handwriting', description: 'Clear writing is easier to mark and shows you\'ve thought about your answer' },
    { icon: '🔍', title: 'Spot issues immediately', description: 'Develop the skill to identify legal issues quickly - essential for time management' },
    { icon: '📊', title: 'Balance theory and practice', description: '60% exam-style questions, 40% theory to ensure you can apply what you know' }
  ]

  return (
    <div className="flex h-screen bg-gray-50 font-worksans">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <img src={logo} alt="logo" className='w-14' />
                <img src={logotext} alt="logo" className='w-[93px] h-[20px] mt-2 -mx-2' />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-6">
          {/* My Learning */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">My Learning</p>}
          <div className="space-y-2">
            <Link to="/dashboard" className="block">
              <NavItem icon={<Home className="w-5 h-5" />} label="Home" open={sidebarOpen} />
            </Link>
            <Link to="/my-courses" className="block">
              <NavItem icon={<BookOpen className="w-5 h-5" />} label="My Courses" open={sidebarOpen} />
            </Link>
            <Link to="/progress" className="block">
              <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Progress" open={sidebarOpen} />
            </Link>
            <Link to="/practice" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Modes */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
          <div className="space-y-2">
            <Link to="/textbook" className="block">
              <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" open={sidebarOpen} />
            </Link>
            <Link to="/practice-questions" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice Questions" open={sidebarOpen} />
            </Link>
            <Link to="/video-tutorials" className="block">
              <NavItem icon={<Video className="w-5 h-5" />} label="Video Tutorial" open={sidebarOpen} />
            </Link>
            <Link to="/flashcards" className="block">
              <NavItem icon={<Grid className="w-5 h-5" />} label="Flashcard" open={sidebarOpen} />
            </Link>
            <Link to="/quizzes" className="block">
              <NavItem icon={<Brain className="w-5 h-5" />} label="Quizzes" open={sidebarOpen} />
            </Link>
            <Link to="/mock-questions" className="block">
              <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Tools */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Tools</p>}
          <div className="space-y-2">
            <Link to="/angel-ai" className="block">
              <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" open={sidebarOpen} />
            </Link>
            <Link to="/sqe-tips" className="block">
              <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" active={true} open={sidebarOpen} />
            </Link>
            <Link to="/key-timeframes" className="block">
              <NavItem icon={<Clock className="w-5 h-5" />} label="Key Timeframes" open={sidebarOpen} />
            </Link>
          </div>
        </nav>

        {/* Settings & User Profile */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.first_name || 'User'}</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                💡 SQE Tips & Tricks
              </h1>
              <p className="text-gray-600">Expert advice on exam technique, avoiding common mistakes, and effective study methods</p>
            </div>

            {/* Search Bar */}
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
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat.id
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
                      {tip.difficulty}
                    </span>
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
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Eye({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  open,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  open: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      } ${open ? '' : 'justify-center'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="text-sm">{label}</span>}
    </button>
  )
}
