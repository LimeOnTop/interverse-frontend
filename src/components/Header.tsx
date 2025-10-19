import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold gradient-text-adaptive">
                        InterVerse
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <ThemeToggle />

                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <User className="w-5 h-5" />
                        <span className="font-medium">{user?.name}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Выйти</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
