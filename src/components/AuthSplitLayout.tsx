import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import PublicNav from './PublicNav'
import LandingBackground from './LandingBackground'

interface AuthSplitLayoutProps {
    marketingTitle: string
    marketingDescription: string
    children: ReactNode
}

export default function AuthSplitLayout({
    marketingTitle,
    marketingDescription,
    children,
}: AuthSplitLayoutProps) {
    return (
        <div className="min-h-screen relative">
            <LandingBackground />

            <div className="relative z-10 min-h-screen flex flex-col">
                <PublicNav landing />

                <div className="flex-1 relative min-h-0">
                    <div className="hidden lg:flex absolute inset-y-0 left-0 z-10 w-[60%] auth-diagonal-panel">
                        <div className="absolute inset-0 gradient-bg-adaptive" />
                        <div className="hero-noise absolute inset-0" />
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="relative flex flex-col justify-center h-full pl-6 pr-14 sm:pl-8 sm:pr-16 lg:pl-10 lg:pr-24 xl:pl-16 xl:pr-28"
                        >
                            <div className="w-full max-w-md xl:max-w-lg text-white">
                                <h2 className="text-3xl font-bold tracking-tight mb-4">{marketingTitle}</h2>
                                <p className="text-white/80 leading-relaxed">{marketingDescription}</p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="relative z-20 flex min-h-full items-center justify-center px-6 py-10 lg:absolute lg:inset-y-0 lg:left-[60%] lg:right-0 lg:min-h-0 lg:items-center lg:justify-start lg:px-8 lg:pl-6 xl:pl-10 xl:pr-12">
                        <div className="w-full max-w-sm xl:max-w-md">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
