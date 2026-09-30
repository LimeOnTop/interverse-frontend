import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

interface PublicNavProps {
    landing?: boolean
    overlay?: boolean
}

function getPastHeroThreshold() {
    return window.innerHeight * 0.9 - 64
}

export default function PublicNav({ landing = false, overlay = false }: PublicNavProps) {
    const [pastHero, setPastHero] = useState(false)
    const location = useLocation()

    const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (location.pathname === '/') {
            event.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    useEffect(() => {
        if (!overlay) return

        const update = () => {
            setPastHero(window.scrollY > getPastHeroThreshold())
        }

        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)

        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [overlay])

    const headerClass = overlay
        ? `fixed top-0 left-0 right-0 z-50 transition-iv ${
              pastHero ? 'iv-landing-nav-solid' : 'bg-transparent border-none'
          }`
        : landing
            ? 'iv-landing-nav sticky top-0 z-40'
            : 'sticky top-0 z-40 iv-surface border-b border-gray-200 dark:border-gray-600'

    const overlayActionClass = pastHero
        ? 'text-inter-verse-green dark:text-purple-400'
        : 'text-gray-900 dark:text-gray-100'

    return (
        <header className={headerClass}>
            <div className="max-w-content mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link
                    to="/"
                    onClick={handleLogoClick}
                    className="text-xl font-bold gradient-text-adaptive tracking-tight hover:opacity-80 transition-iv"
                >
                    InterVerse
                </Link>
                <div className="flex items-center gap-4">
                    <Link
                        to="/pricing"
                        className={
                            overlay
                                ? `text-sm font-medium transition-iv hover:opacity-80 ${overlayActionClass}`
                                : 'btn-ghost text-sm'
                        }
                    >
                        Тарифы
                    </Link>
                    <ThemeToggle
                        iconClassName={overlay ? `${overlayActionClass} transition-iv` : ''}
                        className={overlay && !pastHero ? 'hover:bg-transparent dark:hover:bg-transparent' : ''}
                    />
                    <Link
                        to="/login"
                        className={
                            overlay
                                ? `text-sm font-medium transition-iv hover:opacity-80 ${overlayActionClass}`
                                : 'btn-ghost text-sm'
                        }
                    >
                        Войти
                    </Link>
                    <Link to="/register" className="btn-primary-adaptive text-sm px-5 py-2.5">
                        Регистрация
                    </Link>
                </div>
            </div>
        </header>
    )
}
