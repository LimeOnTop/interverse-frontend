import { effectiveTaskMode, resolveWizardStep, supportsPracticalTasks, trainingWizardSteps } from '../lib/trainingWizard'
import { reminderAllowed } from '../lib/practiceCalendar'
import { usePracticeAvailability } from '../hooks/usePracticeAvailability'
import { AvailabilityNotice } from '../components/PracticeOptionsEditor'
import { reminderChanged } from '../lib/practiceReminders'
import { isTrainingLimitError } from '../store/promoStore'
import { useState, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { startInterviewSession, formatSessionStartError } from '../lib/interviewSession'
import MobileActionBar from '../components/MobileActionBar'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import { clearFormDraft, usePersistedState } from '../hooks/usePersistedForm'
import { useTechnologySearch } from '../hooks/useTechnologySearch'
import { LEVELS, SPECIALIZATIONS, TECH_STACKS } from '../components/InterviewWizard/options'
import SchedulePicker, { nextSlot } from '../components/InterviewWizard/SchedulePicker'

const WIZARD_EASE = [0.23, 1, 0.32, 1] as const

type StartMode = 'now' | 'later'


export default function InterviewWizardPage() {
    const [draft, setDraft] = usePersistedState('interview-wizard', {
        currentStep: 1,
        selectedSpecialization: '',
        selectedTechStack: [] as string[],
        selectedLevel: '',
        taskMode: 'theory' as 'theory' | 'few' | 'many',
        startMode: 'now' as StartMode,
        scheduledAt: '',
    })
    // Stable IDs preserve existing five-step drafts when the task step disappears.
    const { selectedSpecialization, selectedTechStack, selectedLevel } = draft
    const steps = trainingWizardSteps(selectedTechStack)
    const currentStep = resolveWizardStep(draft.currentStep, selectedTechStack)
    const stepIndex = steps.findIndex(step => step.id === currentStep)
    const stepNumber = stepIndex + 1
    const taskMode = effectiveTaskMode(selectedTechStack, draft.taskMode)
    const startMode: StartMode = draft.startMode === 'later' ? 'later' : 'now'
    const scheduledAt = draft.scheduledAt && !draft.scheduledAt.endsWith('Z') ? draft.scheduledAt : ''
    const reduceMotion = useReducedMotion()
    const [keyboardInteraction, setKeyboardInteraction] = useState(false)
    const staticMotion = Boolean(reduceMotion || keyboardInteraction)
    const availability = usePracticeAvailability({technologies:selectedTechStack,specialization:selectedSpecialization,level:selectedLevel,task_mode:taskMode}, currentStep === 5 && Boolean(selectedLevel), true)
    const [isLoading, setIsLoading] = useState(false)
    const [reminderEmail,setReminderEmail]=useState(false)
    const reminderDraftId=useRef(crypto.randomUUID())
    const [direction, setDirection] = useState(1)
    const navigate = useNavigate()

    const update = (patch: Partial<typeof draft>) => setDraft((prev) => {
        const next = { ...prev, ...patch }
        return { ...next, taskMode: effectiveTaskMode(next.selectedTechStack, next.taskMode) }
    })
    const stepPanel = useRef<HTMLElement>(null)
    const goTo = (step: number) => {
        stepPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
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
            case 4: return true
            default: return Boolean(availability.data?.available) && (startMode === 'now' || (Boolean(scheduledAt) && new Date(scheduledAt) > new Date()))
        }
    })()

    const handleSubmit = async () => {
        const withSchedule = startMode === 'later'
        setIsLoading(true)
        try {
            const interviewData: Record<string, unknown> = {
                title: `Тренировка: ${selectedSpecialization} — ${selectedLevel}`,
                description: `Подготовка к собеседованию по направлению ${selectedSpecialization}, уровень ${selectedLevel}`,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
                level: selectedLevel,
                task_mode: taskMode,
            }
            if (withSchedule) {
                interviewData.scheduled_at = new Date(scheduledAt).toISOString()
            }


            if(withSchedule){
                const {data:plan} = await api.put('/practice-reminders',{kind:'draft',target_id:reminderDraftId.current,title:'',scheduled_at:new Date(scheduledAt).toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Moscow',email_enabled:reminderEmail && reminderAllowed(new Date(scheduledAt).toISOString()),lead_minutes:60,payload:{technologies:selectedTechStack,specialization:selectedSpecialization,level:selectedLevel,task_mode:taskMode}})
                reminderChanged(plan.id);toast.success(reminderEmail && reminderAllowed(new Date(scheduledAt).toISOString()) ? 'План сохранён. Напомним за час до начала.' : 'План сохранён на главной, без письма. Попытка спишется при старте.');clearFormDraft('interview-wizard');navigate(`/dashboard?reminder=${plan.id}`);return
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
        else goTo(steps[stepIndex - 1].id)
    }

    const handleNext = () => {
        if (!canContinue) return
        if (stepIndex < steps.length - 1) goTo(steps[stepIndex + 1].id)
        else void handleSubmit()
    }

    return (
        <PageTransition className="max-w-6xl mx-auto">
            <div onPointerDownCapture={() => setKeyboardInteraction(false)} onKeyDownCapture={() => setKeyboardInteraction(true)}>
            <header className="flex items-start justify-between gap-4 mb-6 sm:mb-10">
                <div>
                    <p className="iv-eyebrow">Training studio / 0{stepNumber}</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Новая тренировка</h1>
                    <p className="mt-2 text-secondary">Выбери направление, технологии и уровень. Подходящие параметры появятся по ходу настройки.</p>
                </div>
                <span className="hidden sm:inline-flex mt-8 rounded-md border border-gray-200 dark:border-iv-dark-line px-2.5 py-1 text-xs font-semibold text-secondary">
                    Настройка практики
                </span>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-6 lg:gap-10 items-start">
                <aside className="hidden lg:block pt-4">
                    <ol aria-label="Этапы настройки тренировки">
                        <AnimatePresence initial={false} mode="popLayout">
                        {steps.map((step, index) => {
                            const number = index + 1
                            const done = index < stepIndex
                            const active = step.id === currentStep
                            return (
                                <motion.li data-motion-owned key={step.id} layout={staticMotion ? false : 'position'}
                                    initial={staticMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: staticMotion ? 0 : 0.1 } }}
                                    transition={{ duration: staticMotion ? 0 : 0.18, ease: WIZARD_EASE, layout: { duration: staticMotion ? 0 : 0.22, ease: WIZARD_EASE } }}
                                    className="relative flex gap-4 pb-8 last:pb-0">
                                    {index < steps.length - 1 && (
                                        <span className="absolute left-[17px] top-10 bottom-1 w-px bg-gray-200 dark:bg-iv-dark-line overflow-hidden" aria-hidden>
                                            <motion.span data-motion-owned className="absolute inset-0 bg-inter-verse-green dark:bg-purple-400" style={{ transformOrigin: 'top' }} initial={false}
                                                animate={{ transform: `scaleY(${done ? 1 : 0})` }} transition={{ duration: staticMotion ? 0 : 0.22, ease: WIZARD_EASE }} />
                                        </span>
                                    )}
                                    <button type="button" onClick={() => done && goTo(step.id)} disabled={!done}
                                        aria-current={active ? 'step' : undefined}
                                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors duration-150 ${
                                            active ? 'gradient-bg-adaptive text-white border-transparent'
                                                : done ? 'border-inter-verse-green text-inter-verse-green dark:border-purple-400 dark:text-purple-300 cursor-pointer'
                                                    : 'border-gray-200 dark:border-iv-dark-line text-secondary'
                                        }`}>
                                        {done ? <Check className="w-4 h-4" /> : `0${number}`}
                                    </button>
                                    <span className="pt-1">
                                        <span className={`block text-sm font-semibold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-secondary'}`}>{step.title}</span>
                                        <span className="block text-xs text-secondary mt-0.5">{step.description}</span>
                                    </span>
                                </motion.li>
                            )
                        })}
                        </AnimatePresence>
                    </ol>
                    <p className="mt-10 text-xs text-secondary leading-relaxed">Хорошая подготовка начинается<br />с понятной цели.</p>
                </aside>

                <section ref={stepPanel} className="iv-panel rounded-2xl p-5 sm:p-9 shadow-iv-md min-w-0">
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-xs text-secondary" aria-live="polite">ШАГ 0{stepNumber} / 0{steps.length}</span>
                        <div role="progressbar" aria-label="Прогресс настройки тренировки" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepNumber} className="flex w-28 gap-1.5 sm:w-36">
                            <AnimatePresence initial={false} mode="popLayout">
                                {steps.map((step, index) => <motion.span data-motion-owned key={step.id} layout={!staticMotion} initial={staticMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    transition={{ duration: staticMotion ? 0 : 0.18, ease: WIZARD_EASE }} className="relative h-1.5 flex-1 min-w-0 overflow-hidden rounded-full bg-gray-100 dark:bg-iv-dark-line" aria-hidden>
                                    <motion.span data-motion-owned className="absolute inset-0 rounded-full gradient-bg-adaptive" style={{ transformOrigin: 'left' }} initial={false}
                                        animate={{ transform: `scaleX(${index <= stepIndex ? 1 : 0})` }} transition={{ duration: staticMotion ? 0 : 0.22, ease: WIZARD_EASE }} />
                                </motion.span>)}
                            </AnimatePresence>
                        </div>
                    </div>

                    {currentStep === 5 && <AvailabilityNotice check={availability} />}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div data-motion-owned
                            key={currentStep}
                            initial={staticMotion ? false : { opacity: 0, transform: `translateX(${12 * direction}px)` }}
                            animate={{ opacity: 1, transform: 'translateX(0px)' }}
                            exit={{ opacity: 0, transform: staticMotion ? 'none' : `translateX(${-12 * direction}px)`, transition: { duration: staticMotion ? 0 : 0.1 } }}
                            transition={{ duration: staticMotion ? 0 : 0.18, ease: WIZARD_EASE }}
                            className="mt-6"
                        >
                            {currentStep === 1 && (
                                <StepBody title="Для начала выберем направление." copy="Выбери специализацию: от неё зависят технологии на следующем шаге.">
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
                                <StepBody title="Какой уровень будет у тренировки?" copy="От уровня зависит сложность вопросов и задач.">
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
                            {currentStep === 4 && supportsPracticalTasks(selectedTechStack) && (
                                <StepBody title="Сколько задач добавим?" copy="Теоретические вопросы будут во всех режимах. Если задач в банке меньше, добавим доступные.">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <OptionCard glyph="◎" title="Только теория" description="Без практических задач" selected={taskMode === 'theory'} onClick={() => update({ taskMode: 'theory' })} />
                                        <OptionCard glyph="↗" title="Пара задач" description="От 1 до 3 задач" selected={taskMode === 'few'} onClick={() => update({ taskMode: 'few' })} />
                                        <OptionCard glyph="✦" title="Много задач" description="От 4 до 6 задач" selected={taskMode === 'many'} onClick={() => update({ taskMode: 'many' })} />
                                    </div>
                                </StepBody>
                            )}
                            {currentStep === 5 && (
                                <StepBody title="Всё готово к практике." copy="Проверь параметры и выбери время старта.">
                                    <div className="mb-5 rounded-xl border border-gray-200 dark:border-iv-dark-line p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <strong className="text-gray-900 dark:text-gray-100">
                                            {[specialization?.name, level?.name].filter(Boolean).join(' · ')}
                                        </strong>
                                        <span className="text-sm text-secondary">{selectedTechStack.join(' · ')}</span>
                                        <span className="text-sm text-secondary">{taskMode === 'theory' ? 'Только теория' : taskMode === 'few' ? '1–3 задачи' : '4–6 задач'}</span>
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
                                            <label className="mt-5 flex gap-3 items-center text-sm"><input type="checkbox" checked={reminderEmail && reminderAllowed(scheduledAt)} disabled={!reminderAllowed(scheduledAt)} onChange={e=>setReminderEmail(e.target.checked)}/>Напомнить по email</label><p className="pr-email-hint">{reminderAllowed(scheduledAt) ? 'Одно письмо за час до начала.' : 'До начала меньше часа — план сохраним без письма.'}</p>
                                            <p className="mt-3 text-xs text-secondary">Планирование и перенос не расходуют попытки. Новая тренировка учтётся в лимите при старте.</p>
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-secondary">{taskMode === 'theory' ? 'Теоретические вопросы подберём под выбранный стек и уровень.' : 'Вопросы и практические задачи подберём под выбранный стек и уровень.'}</p>
                                    )}
                                </StepBody>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <footer className="hidden sm:flex mt-8 pt-6 border-t border-gray-200 dark:border-iv-dark-line items-center justify-between gap-3">
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
                            {stepIndex < steps.length - 1 ? 'Продолжить' : startMode === 'later' ? 'Запланировать' : 'Начать тренировку'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </footer>
                </section>
            </div>

            <MobileActionBar>
                <button type="button" onClick={handleBack} className="min-h-[48px] px-3 rounded-lg border border-gray-200 dark:border-iv-dark-line text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {currentStep === 1 ? 'Отмена' : 'Назад'}
                </button>
                <button type="button" onClick={handleNext} disabled={!canContinue || isLoading} className="btn-primary-adaptive min-w-0 min-h-[48px] px-3 rounded-lg inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none">
                    {stepIndex < steps.length - 1 ? 'Продолжить' : startMode === 'later' ? 'Запланировать' : 'Начать тренировку'}
                    <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
            </MobileActionBar>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="iv-panel p-8 text-center">
                        <Spinner size="lg" />
                        <p className="text-secondary mt-4">Готовим тренировку…</p>
                    </div>
                </div>
            )}
            </div>
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
            className={`relative text-left rounded-xl border-2 p-5 transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
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
            title="Теперь выберем технологии."
            copy={`Отметь одну или несколько технологий${specializationName ? ` для ${specializationName}` : ''}: по ним подберём вопросы.`}
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
                <p className="text-sm text-secondary">Ничего не найдено, попробуй другой запрос.</p>
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
                                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
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
                    {selected.length ? selected.join(' · ') : 'Выбери хотя бы одну технологию'}
                </p>
            </div>
        </StepBody>
    )
}
