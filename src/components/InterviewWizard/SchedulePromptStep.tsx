import { motion } from 'framer-motion'
import Button from '../ui/Button'

interface SchedulePromptStepProps {
    onYes: () => void
    onNo: () => void
    onBack: () => void
}

export default function SchedulePromptStep({ onYes, onNo, onBack }: SchedulePromptStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto text-center"
        >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Запланировать тренировку?
            </h2>
            <p className="text-secondary text-sm mb-10">
                Вы можете выбрать дату и время или начать подготовку без планирования
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button onClick={onYes} className="px-10 py-4">Да</Button>
                <Button variant="secondary" onClick={onNo} className="px-10 py-4">Начать сейчас</Button>
            </div>

            <Button variant="ghost" onClick={onBack}>← Назад</Button>
        </motion.div>
    )
}
