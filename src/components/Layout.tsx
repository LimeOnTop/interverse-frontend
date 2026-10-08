import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileTabBar from './MobileTabBar'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const closeSidebar = useCallback(() => setSidebarOpen(false), [])
    // A running training is a focus screen: no bottom tabs to tap by accident.
    const focusMode = location.pathname.startsWith('/interview/')

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    return (
        // Pinned to the viewport so mobile browsers cannot scroll the document and take the header with it.
        <div className="fixed inset-0 h-[100dvh] iv-page flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
                <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className={`max-w-content mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8 ${focusMode ? 'pb-0 sm:pb-8' : 'pb-28 lg:pb-8'}`}>
                        {children}
                    </div>
                </main>
            </div>
            {!focusMode && <MobileTabBar />}
        </div>
    )
}
