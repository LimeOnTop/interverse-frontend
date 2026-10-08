import { isTrainingLimitError } from '../store/promoStore'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { startInterviewSession, formatSessionStartError } from '../lib/interviewSession'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import { clearFormDraft, usePersistedState } from '../hooks/usePersistedForm'
import { useTechnologySearch } from '../hooks/useTechnologySearch'
import { LEVELS, SPECIALIZATIONS, TECH_STACKS } from '../components/InterviewWizard/options'
import SchedulePicker, { nextSlot } from '../components/InterviewWizard/SchedulePicker'

const STEPS = [
    { title: 'Направление', description: 'Ваша специализация' },
    { title: 'Технологии', description: 'Стек для практики' },
    { title: 'Уровень', description: 'Сложность вопросов' },
    { title: 'Старт', description: 'Проверка параметров' },
]

type StartMode = 'now' | 'later'


export default function InterviewWizardPage() {
    const [draft, setDraft] = usePersistedState('interview-wizard', {
        currentStep: 1,
        selectedSpecialization: '',
        selectedTechStack: [] as string[],
        selectedLevel: '',
        startMode: 'now' as StartMode,
        scheduledAt: '',
    })
    // Drafts saved by the old five-step wizard.
    const currentStep = Math.min(Math.max(draft.currentStep, 1), STEPS.length)
    const { selectedSpecialization, selectedTechStack, selectedLevel } = draft
    const startMode: StartMode = draft.startMode === 'later' ? 'later' : 'now'
    const scheduledAt = draft.scheduledAt && !draft.scheduledAt.endsWith('Z') ? draft.scheduledAt : ''
    const [isLoading, setIsLoading] = useState(false)
    const [direction, setDirection] = useState(1)
    const navigate = useNavigate()

    const update = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }))
    const goTo = (step: number) => {
        setDirection(step > currentStep ? 1 : -1)
        update({ currentStep: step })
    }

    const specialization = SPECIALIZATIONS.find((item) => item.id === selectedSpecialization)
    const level = LEVELS.find((item) => item.id === selectedLevel)

    const canContinue = (() => {
        switch (currentStep) {
            case 1: return Boolean(selectedSpecialization)
            case 2: return selectedTechStack.length > 0
            case 3: return Boolean(selectedLevel)
            default: return startMode === 'now' || (Boolean(scheduledAt) && new Date(scheduledAt) > new Date())
        }
    })()

    const handleSubmit = async () => {
        const withSchedule = startMode === 'later'
        setIsLoading(true)
        try {
            const interviewData: Record<string, unknown> = {
                title: `Тренировка: ${selectedSpecialization} — ${selectedLevel}`,
                description: `Самостоятельная тренировка интервью по направлению ${selectedSpecialization}, уровень ${selectedLevel}`,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
                level: selectedLevel,
            }
            if (withSchedule) {
                interviewData.scheduled_at = new Date(scheduledAt).toISOString()
            }

            const response = await api.post('/interviews/', interviewData)
            const interviewId = response.data?.interview?.id as string | undefined

            if (!withSchedule && interviewId) {
                await startInterviewSession(api, interviewId)
                toast.success('Тренировка запущена!')
                clearFormDraft('interview-wizard')
                navigate(`/interview/${interviewId}`)
                return
            }

            toast.success(withSchedule ? 'Тренировка запланирована!' : 'Тренировка создана!')
            clearFormDraft('interview-wizard')
            navigate('/dashboard')
        } catch (error: any) {
            // The limit promo opens from the API interceptor.
            if (!isTrainingLimitError(error)) {
                toast.error(formatSessionStartError(error))
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        if (currentStep === 1) navigate(-1)
        else goTo(currentStep - 1)
    }

    const handleNext = () => {
        if (!canContinue) return
        if (currentStep < STEPS.length) goTo(currentStep + 1)
        else void handleSubmit()
    }

    return (
        <PageTransition className="max-w-6xl mx-auto">
            <header className="flex items-start justify-between gap-4 mb-6 sm:mb-10">
                <div>
                    <p className="iv-eyebrow">Training studio / 0{currentStep}</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Новая тренировка</h1>
                    <p className="mt-2 text-secondary">От вашей цели к следующему шагу.</p>
                </div>
                <span className="hidden sm:inline-flex mt-8 rounded-md border border-gray-200 dark:border-iv-dark-line px-2.5 py-1 text-xs font-semibold text-secondary">
                    Настройка практики
                </span>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-6 lg:gap-10 items-start">
                <aside className="hidden lg:block pt-4">
                    <ol>
                        {STEPS.map((step, index) => {
                            const number = index + 1
                            const done = number < currentStep
                            const active = number === currentStep
                            return (
                                <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                                    {index < STEPS.length - 1 && (
                                        <span className="absolute left-[17px] top-10 bottom-1 w-px bg-gray-200 dark:bg-iv-dark-line" aria-hidden />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => done && goTo(number)}
                                        disabled={!done}
                                        aria-current={active ? 'step' : undefined}
                                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold border transition-iv ${
                                            active
                                                ? 'gradient-bg-adaptive text-white border-transparent'
                                                : done
                                                    ? 'border-inter-verse-green text-inter-verse-green dark:border-purple-400 dark:text-purple-300 cursor-pointer'
                                                    : 'border-gray-200 dark:border-iv-dark-line text-secondary'
                                        }`}
                                    >
                                        {done ? <Check className="w-4 h-4" /> : `0${number}`}
                                    </button>
                                    <span className="pt-1">
                                        <span className={`block text-sm font-semibold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-secondary'}`}>{step.title}</span>
                                        <span className="block text-xs text-secondary mt-0.5">{step.description}</span>
                                    </span>
                                </li>
                            )
                        })}
                    </ol>
                    <p className="mt-10 text-xs text-secondary leading-relaxed">Хорошая подготовка начинается<br />с понятной цели.</p>
                </aside>

                <section className="iv-panel rounded-2xl p-5 sm:p-9 shadow-iv-md min-w-0">
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-xs text-secondary">ШАГ 0{currentStep} / 0{STEPS.length}</span>
                        <div className="iv-track w-24"><span style={{ width: `${(currentStep / STEPS.length) * 100}%` }} /></div>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 14 * direction }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -14 * direction }}
                            transition={{ duration: 0.16 }}
                            className="mt-6"
                        >
                            {currentStep === 1 && (
                                <StepBody title="В каком направлении растём?" copy="Выберите роль. Следующий шаг подстроится под ваш стек.">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SPECIALIZATIONS.map((item) => (
                                            <OptionCard
                                                key={item.id}
                                                glyph={item.glyph}
                                                title={item.name}
                                                description={item.description}
                                                selected={selectedSpecialization === item.id}
                                                onClick={() => update({
                                                    selectedSpecialization: item.id,
                                                    selectedTechStack: item.id === selectedSpecialization ? selectedTechStack : [],
                                                })}
                                            />
                                        ))}
                                    </div>
                                </StepBody>
                            )}
                            {currentStep === 2 && (
                                <TechStep
                                    specialization={selectedSpecialization}
                                    specializationName={specialization?.name || ''}
                                    selected={selectedTechStack}
                                    onChange={(value) => update({ selectedTechStack: value })}
                                />
                            )}
                            {currentStep === 3 && (
                                <StepBody title="На какой уровень нацелены?" copy="Ориентир сложности: выбирайте задачи, которые помогут сделать следующий шаг.">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {LEVELS.map((item) => (
                                            <OptionCard
                                                key={item.id}
                                                glyph={item.glyph}
                                                title={item.name}
                                                description={item.description}
                                                selected={selectedLevel === item.id}
                                                onClick={() => update({ selectedLevel: item.id })}
                                            />
                                        ))}
                                    </div>
                                </StepBody>
                            )}
                            {currentStep === 4 && (
                                <StepBody title="Всё готово к практике." copy="Проверьте параметры и выберите удобный момент для старта.">
                                    <div className="mb-5 rounded-xl border border-gray-200 dark:border-iv-dark-line p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <strong className="text-gray-900 dark:text-gray-100">
                                            {[specialization?.name, level?.name].filter(Boolean).join(' · ')}
                                        </strong>
                                        <span className="text-sm text-secondary">{selectedTechStack.join(' · ')}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <OptionCard glyph="↗" title="Начать сейчас" description="Перейти к вопросам" selected={startMode === 'now'} onClick={() => update({ startMode: 'now' })} />
                                        <OptionCard
                                            glyph="◷"
                                            title="Запланировать"
                                            description="Выбрать дату и время"
                                            selected={startMode === 'later'}
                                            onClick={() => update({ startMode: 'later', scheduledAt: scheduledAt || nextSlot() })}
                                        />
                                    </div>
                                    {startMode === 'later' ? (
                                        <div className="mt-6">
                                            <SchedulePicker value={scheduledAt} onChange={(value) => update({ scheduledAt: value })} />
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-secondary">Вопросы и практические задачи подберём под выбранный стек и уровень.</p>
                                    )}
                                </StepBody>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-iv-dark-line flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-iv-dark-line px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-iv"
                        >
                            {currentStep === 1 ? 'Отмена' : <><ArrowLeft className="w-4 h-4" /> Назад</>}
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canContinue || isLoading}
                            className="btn-primary-adaptive inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {currentStep < STEPS.length ? 'Продолжить' : startMode === 'later' ? 'Запланировать' : 'Начать тренировку'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </footer>
                </section>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="iv-panel p-8 text-center">
                        <Spinner size="lg" />
                        <p className="text-secondary mt-4">Подготовка тренировки...</p>
                    </div>
                </div>
            )}
        </PageTransition>
    )
}

function StepBody({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
    return (
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="mt-2 mb-6 text-secondary">{copy}</p>
            {children}
        </div>
    )
}

function OptionCard({ glyph, title, description, selected, onClick }: {
    glyph: string
    title: string
    description: string
    selected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`relative text-left rounded-xl border-2 p-5 transition-iv ${
                selected
                    ? 'border-inter-verse-green dark:border-purple-400'
                    : 'border-gray-200 dark:border-iv-dark-line hover:border-gray-300 dark:hover:border-gray-500'
            }`}
        >
            <span className={`absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center ${
                selected ? 'gradient-bg-adaptive border-transparent text-white' : 'border-gray-300 dark:border-iv-dark-line'
            }`}
            >
                {selected && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className="block font-mono text-base text-gray-900 dark:text-gray-100">{glyph}</span>
            <span className="mt-4 block font-semibold text-gray-900 dark:text-gray-100">{title}</span>
            <span className="mt-1 block text-xs text-secondary">{description}</span>
        </button>
    )
}

function TechStep({ specialization, specializationName, selected, onChange }: {
    specialization: string
    specializationName: string
    selected: string[]
    onChange: (value: string[]) => void
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const { isSearchActive, searchResults, isSearching } = useTechnologySearch(searchTerm)
    const base = TECH_STACKS[specialization] || []
    const options = isSearchActive ? searchResults : Array.from(new Set([...base, ...selected]))

    const toggle = (tech: string) => {
        onChange(selected.includes(tech) ? selected.filter((item) => item !== tech) : [...selected, tech])
    }

    return (
        <StepBody
            title="Соберите свой стек."
            copy={`Выберите одну или несколько технологий${specializationName ? ` для ${specializationName}` : ''}. Их можно изменить, вернувшись на этот шаг.`}
        >
            <label className="relative block mb-5 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Найти другую технологию"
                    className="input-field rounded-lg !pl-9"
                />
            </label>
            {isSearchActive && isSearching && <p className="text-sm text-secondary mb-3">Ищем технологии…</p>}
            {isSearchActive && !isSearching && options.length === 0 ? (
                <p className="text-sm text-secondary">Ничего не найдено, попробуйте другой запрос.</p>
            ) : (
                <div className="flex flex-wrap gap-2.5">
                    {options.map((tech) => {
                        const isSelected = selected.includes(tech)
                        return (
                            <button
                                key={tech}
                                type="button"
                                onClick={() => toggle(tech)}
                                aria-pressed={isSelected}
                                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-iv ${
                                    isSelected
                                        ? 'border-inter-verse-green text-base font-semibold text-inter-verse-green dark:border-purple-400 dark:text-purple-300'
                                        : 'border-gray-200 dark:border-iv-dark-line text-sm font-medium text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                            >
                                {tech}
                                <span className="text-xs opacity-70">{isSelected ? '✓' : '+'}</span>
                            </button>
                        )
                    })}
                </div>
            )}
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-iv-dark-line p-4">
                <p className="iv-eyebrow">Выбрано</p>
                <p className={`mt-1.5 font-semibold ${selected.length ? 'text-lg text-inter-verse-green dark:text-purple-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {selected.length ? selected.join(' · ') : 'Выберите хотя бы одну технологию'}
                </p>
            </div>
        </StepBody>
    )
}
