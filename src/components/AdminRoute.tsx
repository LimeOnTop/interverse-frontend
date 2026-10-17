import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface AdminRouteProps {
    children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuthStore()

    if (isLoading) return <div role="status" className="min-h-[60vh] grid place-items-center">Проверка сессии…</div>

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
