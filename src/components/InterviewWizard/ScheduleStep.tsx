import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface ScheduleStepProps {
    scheduledAt: string
    onScheduleChange: (date: string) => void
    onNext: () => void
    onBack: () => void
}

export default function ScheduleStep({
    scheduledAt,
    onScheduleChange,
    onNext,
    onBack,
}: ScheduleStepProps) {
    const getTodayDate = () => new Date().toISOString().split('T')[0]

    const [selectedDate, setSelectedDate] = useState(
        scheduledAt ? new Date(scheduledAt).toISOString().split('T')[0] : getTodayDate()
    )
    const [selectedTime, setSelectedTime] = useState(
        scheduledAt ? new Date(scheduledAt).toISOString().split('T')[1]?.substring(0, 5) : ''
    )

    useEffect(() => {
        if (!scheduledAt) {
            setSelectedDate(getTodayDate())
        }
    }, [scheduledAt])

    const handleDateChange = (date: string) => {
        setSelectedDate(date)
        if (selectedTime) {
            const datetime = new Date(`${date}T${selectedTime}:00`)
            onScheduleChange(datetime.toISOString())
        }
    }

    const handleTimeChange = (time: string) => {
        setSelectedTime(time)
        if (selectedDate) {
            const datetime = new Date(`${selectedDate}T${time}:00`)
            onScheduleChange(datetime.toISOString())
        }
    }

    const handleNext = () => {
        if (selectedDate && selectedTime) {
            onNext()
        }
    }

    const isNextDisabled = !selectedDate || !selectedTime

    const timeSlots: string[] = []
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
            <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Планирование тренировки
                </h2>
                <p className="text-secondary text-sm">
                    Выберите удобную дату и время для тренировочного интервью
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card hover padding="md">
                        <div className="mb-3">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Выберите дату</h3>
                            <p className="text-xs text-secondary">Когда пройдёт тренировка?</p>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="input-field w-full"
                        />
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card hover padding="md">
                        <div className="mb-3">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Выберите время</h3>
                            <p className="text-xs text-secondary">Во сколько начнётся тренировка?</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {timeSlots.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => handleTimeChange(time)}
                                    className={`px-3 py-2 text-xs font-medium border-2 transition-iv ${selectedTime === time
                                        ? 'gradient-bg-adaptive text-white border-transparent'
                                        : 'bg-white dark:bg-iv-dark-surface text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-inter-verse-green dark:hover:border-purple-500 hover:bg-green-50 dark:hover:bg-purple-900/20'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {selectedDate && selectedTime && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card padding="md" className="ring-2 ring-inter-verse-green dark:ring-purple-500 bg-green-50 dark:bg-purple-900/20 h-full flex flex-col justify-center">
                            <div className="flex items-center justify-center mb-3">
                                <div className="w-10 h-10 gradient-bg-adaptive flex items-center justify-center mr-3">
                                    <CalendarDays className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Тренировка запланирована</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-center p-2 iv-surface border border-green-200 dark:border-purple-500/30">
                                    <Calendar className="w-4 h-4 text-inter-verse-green dark:text-purple-400 mr-2" />
                                    <div className="text-center">
                                        <p className="text-xs text-secondary">Дата</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center p-2 iv-surface border border-green-200 dark:border-purple-500/30">
                                    <Clock className="w-4 h-4 text-inter-verse-green dark:text-purple-400 mr-2" />
                                    <div className="text-center">
                                        <p className="text-xs text-secondary">Время</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedTime}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>

            <div className="wizard-actions mt-8">
                <Button variant="ghost" onClick={onBack}>← Назад</Button>
                <Button onClick={handleNext} disabled={isNextDisabled}>
                    Начать тренировку
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </motion.div>
    )
}
