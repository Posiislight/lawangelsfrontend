import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, Bell, Home, BarChart3, HelpCircle, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Clock, Send, Plus, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function AngelAI() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentChat, setCurrentChat] = useState(0)
  const [messageInput, setMessageInput] = useState('')

  const chats = [
    {
      id: 0,
      title: 'Contract Law - Consideration',
      date: 'Today',
      messages: [
        {
          role: 'user',
          content: 'Can you explain consideration in contract law?',
          timestamp: '10:30 AM'
        },
        {
          role: 'ai',
          content: 'Consideration is a fundamental concept in contract law. It refers to something of value given by both parties to a contract. Each party must give something and receive something in return.\n\nKey elements:\n• Must be given by both parties\n• Must be of value (money, goods, services, or a promise)\n• Must not be illusory or past consideration\n• Can be executory (promise for promise) or executed (act for promise)',
          timestamp: '10:31 AM'
        },
        {
          role: 'user',
          content: 'What about past consideration? Is that valid?',
          timestamp: '10:32 AM'
        },
        {
          role: 'ai',
          content: 'No, past consideration is generally NOT valid in English contract law. This is established in the case Roscorla v Thomas (1842).\n\nPast consideration means an act or promise was completed BEFORE the promise to give something in return was made.\n\nExample: If I lend you £100 today, and you promise to repay me tomorrow because I helped you, that promise tomorrow cannot be based on past consideration.\n\nException: Past consideration may be valid if there was an implied understanding at the time of the original act that payment would be made.',
          timestamp: '10:33 AM'
        }
      ]
    },
    {
      id: 1,
      title: 'Criminal Law - Actus Reus',
      date: 'Yesterday',
      messages: [
        {
          role: 'user',
          content: 'What is actus reus?',
          timestamp: '2:15 PM'
        },
        {
          role: 'ai',
          content: 'Actus reus is the Latin term for "guilty act" - it refers to the physical element of a crime. It\'s the actual act or omission that constitutes the crime.',
          timestamp: '2:16 PM'
        }
      ]
    },
    {
      id: 2,
      title: 'Property Law - Trusts',
      date: '2 days ago',
      messages: [
        {
          role: 'user',
          content: 'How do express trusts work?',
          timestamp: '11:45 AM'
        },
        {
          role: 'ai',
          content: 'Express trusts are created deliberately with an intention to create a trust relationship. They require three certainties (from Knight v Knight)...',
          timestamp: '11:46 AM'
        }
      ]
    }
  ]

  const suggestedQuestions = [
    'What is mens rea in criminal law?',
    'Explain breach of contract and remedies',
    'What are the requirements for a valid will?',
    'How does negligence liability work?',
    'What is judicial review?',
    'Explain adverse possession in property law'
  ]

  const recentTopics = [
    { title: 'Consideration in Contracts', subject: 'Contract Law', level: 'Core Concept' },
    { title: 'Statutory Interpretation', subject: 'Constitutional Law', level: 'Advanced' },
    { title: 'Damages and Remedies', subject: 'Contract Law', level: 'Intermediate' },
    { title: 'Trusts and Beneficiaries', subject: 'Equity & Trusts', level: 'Core Concept' },
    { title: 'Negligence Duty of Care', subject: 'Tort Law', level: 'Intermediate' },
    { title: 'Criminal Liability Defences', subject: 'Criminal Law', level: 'Advanced' }
  ]

  const sendMessage = () => {
    if (messageInput.trim()) {
      setMessageInput('')
    }
  }

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
              <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" active={true} open={sidebarOpen} />
            </Link>
            <Link to="/sqe-tips" className="block">
              <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" open={sidebarOpen} />
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
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                🤖 Angel AI
              </h1>
              <p className="text-gray-600">Your personal law tutor - ask anything about legal concepts</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search conversations..."
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
        <div className="flex-1 overflow-hidden flex gap-6 p-8">
          {/* Chat List Sidebar */}
          <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                <Plus className="w-5 h-5" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setCurrentChat(chat.id)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    currentChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{chat.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{chat.date}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chats[currentChat].messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask Angel AI about legal concepts..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* Suggested Questions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left text-sm p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 border border-gray-100 hover:border-blue-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Topics */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Recently Asked</h3>
              <div className="space-y-2">
                {recentTopics.map((topic, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
                    <p className="text-sm font-semibold text-gray-900">{topic.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{topic.subject}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">{topic.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
