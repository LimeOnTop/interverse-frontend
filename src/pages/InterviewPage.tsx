import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    ArrowRight,
    Play,
    Pause,
    RotateCcw,
    Save
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../contexts/ThemeContext'

interface Question {
    id: string
    text: string
    type: 'question' | 'task'
    technology: string
    level: string
    specialization: string
    difficulty: number
    time_estimate: number
}

interface Interview {
    id: string
    title: string
    description: string
    scheduled_at: string
    duration: number
    level: string
    specialization: string
    candidate: {
        name: string
        email: string
    }
}

interface InterviewSession {
    sessionId: string
    questions: Question[]
    interview: Interview
}

export default function InterviewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isDark } = useTheme()

    const [session, setSession] = useState<InterviewSession | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [scores, setScores] = useState<Record<string, number>>({})
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInterviewSession()
    }, [id])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isPlaying])

    const loadInterviewSession = () => {
        try {
            const sessionData = localStorage.getItem('interview-session')
            if (sessionData) {
                const parsed = JSON.parse(sessionData)
                setSession(parsed)
                setLoading(false)
            } else {
                toast.error('Сессия интервью не найдена')
                navigate('/interview-service')
            }
        } catch (error) {
            console.error('Error loading session:', error)
            toast.error('Ошибка загрузки сессии')
            navigate('/interview-service')
        }
    }

    const currentQuestion = session?.questions[currentQuestionIndex]
    const progress = session ? ((currentQuestionIndex + 1) / session.questions.length) * 100 : 0

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const handleScoreChange = (questionId: string, score: number) => {
        if (score === 0) {
            setScores(prev => {
                const newScores = { ...prev }
                delete newScores[questionId]
                return newScores
            })
        } else {
        setScores(prev => ({ ...prev, [questionId]: score }))
        }
    }

    const handleNotesChange = (questionId: string, note: string) => {
        setNotes(prev => ({ ...prev, [questionId]: note }))
    }

    const handleTimeSpentChange = (questionId: string, time: number) => {
        setTimeSpent(prev => ({ ...prev, [questionId]: time }))
    }

    const handleNext = () => {
        if (currentQuestionIndex < (session?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setCurrentTime(0)
            setIsPlaying(false)
        }
    }

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
            setCurrentTime(0)
            setIsPlaying(false)
        }
    }

    const handleSave = () => {
        // Здесь можно добавить сохранение ответов на сервер
        toast.success('Ответы сохранены')
    }

    const toggleTimer = () => {
        setIsPlaying(!isPlaying)
    }

    const resetTimer = () => {
        setCurrentTime(0)
        setIsPlaying(false)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getDifficultyLabel = (difficulty: number) => {
        const labels = ['Очень легко', 'Легко', 'Средне', 'Сложно', 'Очень сложно']
        return labels[difficulty - 1] || 'Средне'
    }

    const getTypeLabel = (type: string) => {
        return type === 'question' ? 'Вопрос' : 'Практическая задача'
    }

    const getTypeIcon = (type: string) => {
        return type === 'question' ? '' : '⚡'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-inter-verse-green' : 'border-inter-verse-green'}`}></div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Сессия интервью не найдена
                </h2>
                <button
                    onClick={() => navigate('/interview-service')}
                    className="btn-primary"
                >
                    Вернуться к выбору интервью
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/interview-service')}
                            className={`mr-4 p-2 rounded-lg transition-colors ${isDark
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {session.interview.title}
                            </h1>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{session.interview.description}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Кандидат: <span className="font-medium">{session.interview.candidate.name}</span>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {session.interview.specialization} • {session.interview.level}
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className={`flex items-center justify-between text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Прогресс: {currentQuestionIndex + 1} из {session.questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className="gradient-bg-adaptive h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                >
                    {currentQuestion && (
                        <>
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <span className="text-2xl mr-3">
                                            {getTypeIcon(currentQuestion.type)}
                                        </span>
                                        <div>
                                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {getTypeLabel(currentQuestion.type)}
                                            </h2>
                                            <div className={`flex items-center space-x-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                <span>Технология: {currentQuestion.technology}</span>
                                                <span>•</span>
                                                <span>Сложность: {getDifficultyLabel(currentQuestion.difficulty)}</span>
                                                <span>•</span>
                                                <span>Время: {currentQuestion.time_estimate} мин</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {currentQuestion.text}
                                    </p>
                                </div>

                                {/* Timer */}
                                <div className={`ml-6 rounded-xl p-4 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <div className={`text-2xl font-mono font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatTime(currentTime)}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={toggleTimer}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isPlaying
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={resetTimer}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isDark
                                                ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Answer Section */}
                            <div className="space-y-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Ответ кандидата:
                                    </label>
                                    <textarea
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                        placeholder="Запишите ответ кандидата..."
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent resize-none ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Оценка (1-5):
                                        </label>
                                        <div className={`p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${isDark
                                            ? 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
                                            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                                            }`}>
                                            {/* Rating Scale Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Оценка:
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>1</span>
                                                    <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-2"></div>
                                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>5</span>
                                                </div>
                                            </div>

                                            {/* Interactive Rating Buttons */}
                                            <div className="flex items-center justify-center space-x-3 mb-4">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => handleScoreChange(currentQuestion.id, rating)}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 transform hover:scale-105 ${scores[currentQuestion.id] === rating
                                                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg ring-2 ring-yellow-300'
                                                                : isDark
                                                                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-yellow-400 hover:shadow-md'
                                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-yellow-500 hover:shadow-md'
                                                            }`}
                                                    >
                                                        {rating}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Rating Description */}
                                            <div className="text-center">
                                                <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                    {scores[currentQuestion.id] ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <span className="text-lg font-bold text-yellow-500">
                                                                    {scores[currentQuestion.id]}
                                                                </span>
                                                                <span className="text-gray-400">/</span>
                                                                <span className="text-gray-400">5</span>
                                                            </div>
                                                            <div className={`text-sm ${scores[currentQuestion.id] === 1 ? 'text-red-500' :
                                                                    scores[currentQuestion.id] === 2 ? 'text-orange-500' :
                                                                        scores[currentQuestion.id] === 3 ? 'text-yellow-500' :
                                                                            scores[currentQuestion.id] === 4 ? 'text-green-500' :
                                                                                'text-green-600'
                                                                }`}>
                                                                {scores[currentQuestion.id] === 1 ? 'Неудовлетворительно' :
                                                                    scores[currentQuestion.id] === 2 ? 'Удовлетворительно' :
                                                                        scores[currentQuestion.id] === 3 ? 'Хорошо' :
                                                                            scores[currentQuestion.id] === 4 ? 'Очень хорошо' :
                                                                                'Отлично'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Нажмите на цифру для оценки</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Clear Selection Button */}
                                            {scores[currentQuestion.id] && (
                                                <div className="text-center mt-3">
                                                    <button
                                                        onClick={() => handleScoreChange(currentQuestion.id, 0)}
                                                        className={`text-xs px-4 py-2 rounded-lg transition-all duration-200 ${isDark
                                                                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700 border border-gray-600'
                                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 border border-gray-300'
                                                            }`}
                                                    >
                                                        ✕ Сбросить оценку
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Время на ответ (минуты):
                                        </label>
                                        <input
                                            type="number"
                                            value={timeSpent[currentQuestion.id] || ''}
                                            onChange={(e) => handleTimeSpentChange(currentQuestion.id, parseInt(e.target.value))}
                                            placeholder="0"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent ${isDark
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Заметки:
                                    </label>
                                    <textarea
                                        value={notes[currentQuestion.id] || ''}
                                        onChange={(e) => handleNotesChange(currentQuestion.id, e.target.value)}
                                        placeholder="Дополнительные заметки..."
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent resize-none ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${currentQuestionIndex === 0
                        ? isDark
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDark
                            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Предыдущий</span>
                </button>

                <div className="flex space-x-3">
                    <button
                        onClick={handleSave}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${isDark
                            ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                    >
                        <Save className="w-5 h-5" />
                        <span>Сохранить</span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === session.questions.length - 1}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${currentQuestionIndex === session.questions.length - 1
                            ? isDark
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'gradient-bg-adaptive text-white hover:opacity-90'
                            }`}
                    >
                        <span>Следующий</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
