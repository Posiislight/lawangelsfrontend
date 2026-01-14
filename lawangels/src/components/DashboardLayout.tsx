import { type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useSidebar } from '../contexts/SidebarContext'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { setSidebarOpen, isMobile } = useSidebar()

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-worksans">
            {/* Mobile Header - only visible on mobile */}
            {isMobile && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="logo" className='w-10' />
                        <img src={logotext} alt="logo" className='w-[80px] h-[17px]' />
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                </div>
            )}

            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
