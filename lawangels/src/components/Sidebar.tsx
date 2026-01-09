import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { BookOpen, Clock, Home, HelpCircle, Menu, X, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, ClipboardList, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
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
            <NavItem icon={<Home className="w-5 h-5" />} label="Home" active={isActive('/dashboard')} open={sidebarOpen} />
          </Link>
          <Link to="/my-courses" className="block">
            <NavItem icon={<BookOpen className="w-5 h-5" />} label="My Courses" active={isActive('/my-courses')} open={sidebarOpen} />
          </Link>
          <Link to="/practice" className="block">
            <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" active={isActive('/practice')} open={sidebarOpen} />
          </Link>
        </div>

        {/* Learning Modes */}
        {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
        <div className="space-y-2">
          <Link to="/textbook" className="block">
            <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" active={isActive('/textbook')} open={sidebarOpen} />
          </Link>
          <Link to="/summary-notes" className="block">
            <NavItem icon={<FileText className="w-5 h-5" />} label="Summary Notes" active={isActive('/summary-notes')} open={sidebarOpen} />
          </Link>
          <Link to="/video-tutorials" className="block">
            <NavItem icon={<Video className="w-5 h-5" />} label="Video Tutorial" active={isActive('/video-tutorials')} open={sidebarOpen} />
          </Link>
          <Link to="/flashcards" className="block">
            <NavItem icon={<Grid className="w-5 h-5" />} label="Flashcard" active={isActive('/flashcards')} open={sidebarOpen} />
          </Link>
          <Link to="/quizzes" className="block">
            <NavItem icon={<Brain className="w-5 h-5" />} label="Quizzes" active={isActive('/quizzes')} open={sidebarOpen} />
          </Link>
          <Link to="/mock-questions" className="block">
            <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" active={isActive('/mock-questions')} open={sidebarOpen} />
          </Link>
          <Link to="/practice-questions" className="block">
            <NavItem icon={<ClipboardList className="w-5 h-5" />} label="Practice Questions" active={isActive('/practice-questions')} open={sidebarOpen} />
          </Link>
        </div>

        {/* Learning Tools */}
        {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Tools</p>}
        <div className="space-y-2">
          <Link to="/angel-ai" className="block">
            <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" active={isActive('/angel-ai')} open={sidebarOpen} />
          </Link>
          <Link to="/sqe-tips" className="block">
            <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" active={isActive('/sqe-tips')} open={sidebarOpen} />
          </Link>
          <Link to="/key-timeframes" className="block">
            <NavItem icon={<Clock className="w-5 h-5" />} label="Key Timeframes" active={isActive('/key-timeframes')} open={sidebarOpen} />
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${sidebarOpen ? '' : 'justify-center'}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
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
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active
        ? 'bg-blue-50 text-blue-600 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
        } ${open ? '' : 'justify-center'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="text-sm">{label}</span>}
    </button>
  )
}
