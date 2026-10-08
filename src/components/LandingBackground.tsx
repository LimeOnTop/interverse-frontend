import { useTheme } from '../contexts/ThemeContext'

/** Unsplash (free license): cosmic / tech imagery */
const DARK_BG_IMAGE =
    'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=2400&q=80'

const LIGHT_BG_IMAGE =
    'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=2400&q=80'

interface LandingBackgroundProps {
    /** Cover full viewport behind content */
    fixed?: boolean
}

export default function LandingBackground({ fixed = true }: LandingBackgroundProps) {
    const { isDark } = useTheme()

    return (
        <div
            className={`${fixed ? 'fixed inset-0 -z-10' : 'absolute inset-0'} overflow-hidden`}
            aria-hidden
        >
            {/* Photo layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
                style={{
                    backgroundImage: `url(${isDark ? DARK_BG_IMAGE : LIGHT_BG_IMAGE})`,
                    opacity: isDark ? 0.35 : 0.12,
                }}
            />

            {/* Brand gradient overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(45, 27, 105, 0.92) 0%, rgba(26, 11, 61, 0.96) 50%, rgba(47, 47, 47, 0.98) 100%)'
                        : 'linear-gradient(135deg, rgba(245, 242, 234, 0.97) 0%, rgba(255, 253, 248, 0.95) 40%, rgba(49, 93, 70, 0.05) 100%)',
                }}
            />

            {/* Subtle grid */}
            <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '64px 64px',
                }}
            />

            {/* Noise texture */}
            <div className="hero-noise absolute inset-0" />
        </div>
    )
}
