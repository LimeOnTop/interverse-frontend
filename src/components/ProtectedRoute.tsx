import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuthStore()
    const location=useLocation()

    if (isLoading) return <div role="status" className="min-h-[60vh] grid place-items-center">Проверка сессии…</div>

    if (!isAuthenticated) {
        const id=new URLSearchParams(location.search).get('reminder')
        return <Navigate to={location.pathname==='/dashboard' && id && /^[a-f0-9-]{36}$/i.test(id) ? '/login?reminder='+encodeURIComponent(id) : '/login'} replace />
    }

    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />
    }

    return <>{children}</>
}
