import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

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
    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0]
    }

    const [selectedDate, setSelectedDate] = useState(
        scheduledAt ? new Date(scheduledAt).toISOString().split('T')[0] : getTodayDate()
    )
    const [selectedTime, setSelectedTime] = useState(
        scheduledAt ? new Date(scheduledAt).toISOString().split('T')[1]?.substring(0, 5) : ''
    )

    // Set default date to today if scheduledAt is empty
    useEffect(() => {
        if (!scheduledAt) {
            const today = getTodayDate()
            setSelectedDate(today)
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

    // Generate time slots (every 30 minutes from 9:00 to 18:00)
    const timeSlots = []
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            timeSlots.push(timeString)
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
                <div className="flex items-center justify-center w-16 h-16 gradient-bg-adaptive rounded-2xl mx-auto mb-4 shadow-lg">
                    <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Планирование интервью
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Выберите удобную дату и время для проведения интервью
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Date Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 gradient-bg-adaptive rounded-xl flex items-center justify-center mr-3">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Выберите дату</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Когда будет проводиться интервью?</p>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="input-field-adaptive w-full text-lg font-medium"
                        />
                    </div>
                </motion.div>

                {/* Time Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 gradient-bg-adaptive rounded-xl flex items-center justify-center mr-3">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Выберите время</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">В какое время начнется интервью?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {timeSlots.map((time) => (
                            <motion.button
                                key={time}
                                onClick={() => handleTimeChange(time)}
                                className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-200 ${selectedTime === time
                                    ? 'gradient-bg-adaptive text-white border-transparent shadow-lg'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-inter-verse-green dark:hover:border-purple-500 hover:bg-green-50 dark:hover:bg-purple-900/20 hover:text-inter-verse-green dark:hover:text-purple-400'
                                    }`}
                            >
                                {time}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Selected Date & Time Display */}
            {selectedDate && selectedTime && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-green-200 dark:border-purple-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 gradient-bg-adaptive rounded-xl flex items-center justify-center mr-4">
                            <CalendarDays className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Интервью запланировано</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Проверьте выбранные дату и время</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-purple-500/30">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-purple-400 mr-3" />
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Дата</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {new Date(selectedDate).toLocaleDateString('ru-RU', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-purple-500/30">
                            <Clock className="w-5 h-5 text-green-600 dark:text-purple-400 mr-3" />
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Время</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedTime}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-between mt-8"
            >
                <button
                    onClick={onBack}
                    className="px-8 py-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
                >
                    ← Назад
                </button>
                <button
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${isNextDisabled
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'gradient-bg-adaptive text-white hover:opacity-90 shadow-lg hover:shadow-xl'
                        }`}
                >
                    <span>Завершить планирование</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </motion.div>
        </motion.div>
    )
}