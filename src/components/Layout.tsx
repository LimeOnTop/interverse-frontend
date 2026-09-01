import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="h-screen iv-page flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="max-w-content mx-auto px-6 py-8 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
