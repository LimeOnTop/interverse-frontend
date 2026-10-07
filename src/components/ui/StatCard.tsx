import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from './Card'

interface StatCardProps {
    label: string
    value: number | string
    icon: LucideIcon
    delay?: number
}

export default function StatCard({ label, value, icon: Icon, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
        >
            <Card padding="md" className="border-gray-200 dark:border-iv-dark-line">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
                        <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100 mt-1">{value}</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-iv-dark-line">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.75} />
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
