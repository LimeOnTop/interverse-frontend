import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

interface UserAvatarProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

/** Square avatar: uploaded photo, otherwise the first letter of the name. */
export default function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
    const { user, avatarUrl } = useAuthStore()
    const [failed, setFailed] = useState(false)
    const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()

    useEffect(() => {
        setFailed(false)
    }, [avatarUrl])

    return (
        <span className={`iv-avatar ${size === 'md' ? '' : `is-${size}`} ${className}`} aria-hidden="true">
            {avatarUrl && !failed ? <img src={avatarUrl} alt="" onError={() => setFailed(true)} /> : initial}
        </span>
    )
}
