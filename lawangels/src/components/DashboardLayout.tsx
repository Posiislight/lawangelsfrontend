import { type ReactNode } from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-gray-50 font-worksans">
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
