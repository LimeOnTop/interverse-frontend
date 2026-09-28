import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    User,
    Save,
    Upload,
    X,
    Download,
    Check,
    Plus,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import ModernSelect from '../components/ModernSelect'
import toast from 'react-hot-toast'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { readFormDraft, writeFormDraft } from '../hooks/usePersistedForm'
import { LayoutGroup, motion } from 'framer-motion'

interface ProfileData {
    work_experiences: string[]
    avatar_url: string
    about_me: string
    higher_education: string
    english_level: string
}

const MAX_WORK_EXPERIENCES = 5

function parseWorkExperiences(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .slice(0, MAX_WORK_EXPERIENCES)
    }
    if (typeof raw !== 'string' || !raw.trim()) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => String(item ?? '').trim())
                .filter(Boolean)
                .slice(0, MAX_WORK_EXPERIENCES)
        }
    } catch {
        /* legacy plain-text field from hh.ru / older saves */
    }
    return [raw]
}

function serializeWorkExperiences(items: string[]): string {
    const filled = items.map((item) => item.trim()).filter(Boolean)
    if (filled.length <= 1) return filled[0] ?? ''
    return JSON.stringify(filled)
}

const ENGLISH_LEVELS = [
    { value: '', label: 'Не указан' },
    { value: 'A1', label: 'A1 — Beginner' },
    { value: 'A2', label: 'A2 — Elementary' },
    { value: 'B1', label: 'B1 — Intermediate' },
    { value: 'B2', label: 'B2 — Upper Intermediate' },
    { value: 'C1', label: 'C1 — Advanced' },
    { value: 'C2', label: 'C2 — Proficiency' },
    { value: 'native', label: 'Native' },
]

const emptyProfile: ProfileData = {
    work_experiences: [], avatar_url: '', about_me: '', higher_education: '', english_level: '',
}

type ProfileBlockId = 'avatar' | 'about_me' | 'higher_education' | 'english_level'
type OpenBlockId = ProfileBlockId | `work:${number}`

const PROFILE_BLOCKS: {
    id: ProfileBlockId
    title: string
    span: string
    minHeight: string
}[] = [
    { id: 'avatar', title: 'Аватар', span: 'profile-span-md', minHeight: 'min-h-[13rem]' },
    { id: 'about_me', title: 'О себе', span: 'profile-span-xl', minHeight: 'min-h-[11rem]' },
    { id: 'higher_education', title: 'Образование', span: 'profile-span-sm', minHeight: 'min-h-[11rem]' },
    { id: 'english_level', title: 'Английский', span: 'profile-span-lg', minHeight: 'min-h-[10rem]' },
]

const PROFILE_BLOCK_LAYOUT = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 28,
    mass: 0.75,
}

function isBlockFilled(id: ProfileBlockId, profile: ProfileData) {
    if (id === 'avatar') return Boolean(profile.avatar_url.trim())
    return Boolean(profile[id].trim())
}

const WORK_BLOCK = { title: 'Опыт работы', span: 'profile-span-lg', extraSpan: 'profile-span-md', minHeight: 'min-h-[13rem]' }
const ADD_EXPERIENCE_BLOCK = { title: 'Добавить опыт', span: 'profile-span-md', minHeight: 'min-h-[13rem]' }

const MAX_SOURCE_BYTES = 25 * 1024 * 1024
/** Backend stores data URL in TEXT and rejects payloads over ~900KB. */
const MAX_AVATAR_PAYLOAD_CHARS = 850_000
const AVATAR_MAX_SIZE = 512
const AVATAR_MIN_SIZE = 256
const HH_OAUTH_STATE_KEY = 'hh-oauth-state'

function dataUrlByteLength(dataUrl: string) {
    return dataUrl.length
}

async function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
    const objectUrl = URL.createObjectURL(file)
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Не удалось прочитать изображение'))
            img.src = objectUrl
        })
        return { image, objectUrl }
    } catch (error) {
        URL.revokeObjectURL(objectUrl)
        throw error
    }
}

function drawScaled(image: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('Не удалось обработать изображение')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    return canvas
}

async function compressImageFile(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Выберите файл изображения')
    }

    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error('Исходный файл слишком большой (макс. 25 МБ)')
    }

    const { image, objectUrl } = await loadImageFromFile(file)

    try {
        let maxEdge = AVATAR_MAX_SIZE
        let quality = 0.85
        let dataUrl = ''

        for (let attempt = 0; attempt < 12; attempt += 1) {
            const canvas = drawScaled(image, maxEdge)
            dataUrl = canvas.toDataURL('image/jpeg', quality)

            if (dataUrlByteLength(dataUrl) <= MAX_AVATAR_PAYLOAD_CHARS) {
                return dataUrl
            }

            if (quality > 0.45) {
                quality = Math.max(0.45, quality - 0.1)
                continue
            }

            if (maxEdge > AVATAR_MIN_SIZE) {
                maxEdge = Math.max(AVATAR_MIN_SIZE, Math.round(maxEdge * 0.75))
                quality = 0.8
                continue
            }

            quality = Math.max(0.35, quality - 0.05)
        }

        if (dataUrlByteLength(dataUrl) > MAX_AVATAR_PAYLOAD_CHARS) {
            throw new Error('Не удалось сжать изображение до допустимого размера. Выберите другое фото.')
        }

        return dataUrl
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

export default function ProfilePage() {
    const user = useAuthStore((s) => s.user)
    const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl)
    const [searchParams, setSearchParams] = useSearchParams()
    const [profile, setProfile] = useState<ProfileData>(emptyProfile)
    const [openBlock, setOpenBlock] = useState<OpenBlockId | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)
    const [isImportingHH, setIsImportingHH] = useState(false)
    const [avatarError, setAvatarError] = useState(false)
    const [showHHModal, setShowHHModal] = useState(false)
    const [resumeURL, setResumeURL] = useState(() => readFormDraft<string>('hh-resume-url-input') ?? '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const hhImportStartedRef = useRef(false)
    const persistProfileRef = useRef(false)

    const profileDraftKey = user?.id ? `profile:${user.id}` : ''

    useEffect(() => { if (user?.id) fetchProfile() }, [user?.id])

    useEffect(() => {
        if (!persistProfileRef.current || !profileDraftKey) return
        writeFormDraft(profileDraftKey, {
            work_experiences: profile.work_experiences,
            about_me: profile.about_me,
            higher_education: profile.higher_education,
            english_level: profile.english_level,
        })
    }, [profile.work_experiences, profile.about_me, profile.higher_education, profile.english_level, profileDraftKey])

    useEffect(() => {
        writeFormDraft('hh-resume-url-input', resumeURL)
    }, [resumeURL])

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        if (!code || !user?.id || hhImportStartedRef.current) {
            return
        }

        const savedState = sessionStorage.getItem(HH_OAUTH_STATE_KEY)
        if (savedState && state && savedState !== state) {
            toast.error('Некорректный OAuth state от hh.ru')
            setSearchParams({}, { replace: true })
            return
        }

        hhImportStartedRef.current = true
        void importFromHH(code, resumeURL || sessionStorage.getItem('hh-resume-url') || '')
            .finally(() => {
                sessionStorage.removeItem(HH_OAUTH_STATE_KEY)
                sessionStorage.removeItem('hh-resume-url')
                setSearchParams({}, { replace: true })
            })
    }, [searchParams, user?.id])

    const fetchProfile = async () => {
        if (!user?.id) return
        try {
            setIsLoading(true)
            const { data } = await api.get(`/users/${user.id}/profile`)
            if (data.profile) {
                const loaded: ProfileData = {
                    work_experiences: parseWorkExperiences(data.profile.work_experience),
                    avatar_url: data.profile.avatar_url || '',
                    about_me: data.profile.about_me || '',
                    higher_education: data.profile.higher_education || '',
                    english_level: data.profile.english_level || '',
                }
                const draft = user?.id ? readFormDraft<{
                    work_experiences?: string[]
                    work_experience?: string
                    about_me?: string
                    higher_education?: string
                    english_level?: string
                }>(`profile:${user.id}`) : null
                setProfile({
                    ...loaded,
                    work_experiences: draft?.work_experiences
                        ? parseWorkExperiences(draft.work_experiences)
                        : draft?.work_experience != null
                            ? parseWorkExperiences(draft.work_experience)
                            : loaded.work_experiences,
                    about_me: draft?.about_me ?? loaded.about_me,
                    higher_education: draft?.higher_education ?? loaded.higher_education,
                    english_level: draft?.english_level ?? loaded.english_level,
                })
                persistProfileRef.current = true
                setAvatarUrl(data.profile.avatar_url || null)
                setAvatarError(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка загрузки')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field: Exclude<keyof ProfileData, 'work_experiences'>, value: string) => {
        setProfile((p) => ({ ...p, [field]: value }))
    }

    const removeWorkExperience = (index: number) => {
        setProfile((p) => ({
            ...p,
            work_experiences: p.work_experiences.filter((_, i) => i !== index),
        }))
        setOpenBlock((current) => (current === `work:${index}` ? null : current))
    }

    const handleWorkChange = (index: number, value: string) => {
        if (!value.trim()) {
            removeWorkExperience(index)
            return
        }
        setProfile((p) => ({
            ...p,
            work_experiences: p.work_experiences.map((item, i) => (i === index ? value : item)),
        }))
    }

    const handleAddExperience = () => {
        setProfile((p) => {
            const filled = p.work_experiences.filter((item) => item.trim())
            if (filled.length >= MAX_WORK_EXPERIENCES) return p
            if (filled.length !== p.work_experiences.length) return p
            const next = [...filled, '']
            setOpenBlock(`work:${next.length - 1}`)
            return { ...p, work_experiences: next }
        })
    }

    const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''

        if (!file) return

        try {
            setIsProcessingAvatar(true)
            const dataUrl = await compressImageFile(file)
            setProfile((p) => ({ ...p, avatar_url: dataUrl }))
            setAvatarUrl(dataUrl)
            setAvatarError(false)
            toast.success('Фото сжато и выбрано')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось загрузить фото'
            toast.error(message)
        } finally {
            setIsProcessingAvatar(false)
        }
    }

    const handleRemoveAvatar = () => {
        setProfile((p) => ({ ...p, avatar_url: '' }))
        setAvatarUrl(null)
        setAvatarError(false)
    }

    const importFromHH = async (code: string, preferredResumeURL = '') => {
        if (!user?.id) return

        try {
            setIsImportingHH(true)
            const { data } = await api.post(`/users/${user.id}/profile/import/hh`, {
                code,
                resume_url: preferredResumeURL || undefined,
            })

            const imported = data.profile
            if (!imported) {
                throw new Error('Пустой ответ импорта')
            }

            setProfile({
                work_experiences: parseWorkExperiences(imported.work_experience),
                avatar_url: imported.avatar_url || '',
                about_me: imported.about_me || '',
                higher_education: imported.higher_education || '',
                english_level: imported.english_level || '',
            })
            setAvatarUrl(imported.avatar_url || null)
            setAvatarError(false)
            setShowHHModal(false)
            toast.success(data.message || 'Данные из hh.ru загружены')
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Не удалось импортировать из hh.ru')
        } finally {
            setIsImportingHH(false)
        }
    }

    const handleStartHHImport = async () => {
        if (!user?.id) return

        try {
            setIsImportingHH(true)
            const { data } = await api.get(`/users/${user.id}/profile/hh/auth-url`)
            if (!data.auth_url) {
                throw new Error('Не получен URL авторизации hh.ru')
            }

            if (data.state) {
                sessionStorage.setItem(HH_OAUTH_STATE_KEY, data.state)
            }
            if (resumeURL.trim()) {
                sessionStorage.setItem('hh-resume-url', resumeURL.trim())
            } else {
                sessionStorage.removeItem('hh-resume-url')
            }

            window.location.href = data.auth_url
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Импорт hh.ru недоступен')
            setIsImportingHH(false)
        }
    }

    const handleSave = async () => {
        if (!user?.id) return
        try {
            setIsSaving(true)
            await api.put(`/users/${user.id}/profile`, {
                work_experience: serializeWorkExperiences(profile.work_experiences),
                avatar_url: profile.avatar_url,
                about_me: profile.about_me,
                higher_education: profile.higher_education,
                english_level: profile.english_level,
            })
            setAvatarUrl(profile.avatar_url || null)
            writeFormDraft(`profile:${user.id}`, {
                work_experiences: profile.work_experiences,
                about_me: profile.about_me,
                higher_education: profile.higher_education,
                english_level: profile.english_level,
            })
            toast.success('Профиль сохранён')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка сохранения')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <Spinner size="lg" className="h-64" />

    const renderWorkEditor = (index: number) => (
        <textarea
            value={profile.work_experiences[index] ?? ''}
            onChange={(e) => handleWorkChange(index, e.target.value)}
            className="input-field min-h-[140px] resize-y"
            rows={5}
            placeholder="Профессиональный опыт…"
        />
    )

    const renderMosaicTile = (
        key: string,
        title: string,
        span: string,
        minHeight: string,
        open: boolean,
        filled: boolean,
        onToggle: () => void,
        editor: ReactNode,
    ) => {
        const accented = filled && !open

        return (
            <motion.article
                key={key}
                layout
                transition={{ layout: PROFILE_BLOCK_LAYOUT }}
                onClick={onToggle}
                className={[
                    'profile-block p-6 cursor-pointer',
                    span,
                    open ? 'profile-block-open' : minHeight,
                    accented ? 'profile-block-filled' : '',
                ].join(' ')}
            >
                <motion.h2
                    layout="position"
                    className={`profile-block-title pr-10 ${accented ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}
                >
                    {title}
                </motion.h2>

                {open && (
                    <motion.div
                        layout="position"
                        className="profile-block-editor"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {editor}
                    </motion.div>
                )}

                {accented && (
                    <span className="profile-block-check" aria-hidden>
                        <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </span>
                )}
            </motion.article>
        )
    }

    const renderBlockEditor = (id: ProfileBlockId) => {
        const fieldClass = 'input-field'

        if (id === 'avatar') {
            return (
                <div className="flex items-start gap-5">
                    {profile.avatar_url && !avatarError ? (
                        <img
                            src={profile.avatar_url}
                            alt="Аватар"
                            className="w-24 h-24 object-cover border border-gray-200 dark:border-gray-600"
                            onError={() => setAvatarError(true)}
                        />
                    ) : (
                        <div className="w-24 h-24 flex items-center justify-center border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-iv-dark-bg">
                            <User className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm mb-3 text-secondary">
                            Выберите фото с устройства. Поддерживаются JPEG, PNG и WebP (до 25 МБ).
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarSelect}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                loading={isProcessingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm px-4 py-2"
                            >
                                <Upload className="w-4 h-4" />
                                Выбрать фото
                            </Button>
                            {profile.avatar_url && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleRemoveAvatar}
                                    className="text-sm px-4 py-2"
                                >
                                    <X className="w-4 h-4" />
                                    Удалить
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        if (id === 'about_me') {
            return (
                <textarea
                    value={profile.about_me}
                    onChange={(e) => handleChange('about_me', e.target.value)}
                    className={`${fieldClass} min-h-[140px] resize-y`}
                    rows={5}
                    placeholder="Кратко о себе…"
                />
            )
        }

        if (id === 'higher_education') {
            return (
                <input
                    type="text"
                    value={profile.higher_education}
                    onChange={(e) => handleChange('higher_education', e.target.value)}
                    className={fieldClass}
                    placeholder="ВУЗ, специальность"
                />
            )
        }

        return (
            <div onClick={(e) => e.stopPropagation()}>
                <ModernSelect
                    options={ENGLISH_LEVELS}
                    value={profile.english_level}
                    onChange={(v) => handleChange('english_level', v)}
                    placeholder="Уровень английского"
                    searchable={false}
                />
            </div>
        )
    }

    return (
        <PageTransition>
            <div className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            Профиль
                        </h1>
                        <p className="text-secondary mt-1 text-sm leading-relaxed">
                            Данные для персонализации тренировок
                        </p>
                    </div>
                    <Button
                        type="button"
                        loading={isImportingHH}
                        onClick={() => setShowHHModal(true)}
                        className="shrink-0 self-start"
                    >
                        <Download className="w-5 h-5" />
                        Импортировать из hh.ru
                    </Button>
                </div>

                <LayoutGroup>
                <div className="profile-mosaic">
                    {PROFILE_BLOCKS.filter((block) => block.id === 'avatar').map((block) => {
                        const filled = isBlockFilled(block.id, profile)
                        const open = openBlock === block.id
                        return renderMosaicTile(
                            block.id,
                            block.title,
                            block.span,
                            block.minHeight,
                            open,
                            filled,
                            () => setOpenBlock(open ? null : block.id),
                            renderBlockEditor(block.id),
                        )
                    })}

                    {profile.work_experiences.map((experience, index) => {
                        const filled = Boolean(experience.trim())
                        const openId: OpenBlockId = `work:${index}`
                        const open = openBlock === openId
                        return renderMosaicTile(
                            openId,
                            WORK_BLOCK.title,
                            index === 0 ? WORK_BLOCK.span : WORK_BLOCK.extraSpan,
                            WORK_BLOCK.minHeight,
                            open,
                            filled,
                            () => {
                                if (open) {
                                    if (!experience.trim()) {
                                        removeWorkExperience(index)
                                    } else {
                                        setOpenBlock(null)
                                    }
                                    return
                                }
                                setOpenBlock(openId)
                            },
                            renderWorkEditor(index),
                        )
                    })}

                    {profile.work_experiences.length < MAX_WORK_EXPERIENCES
                        && profile.work_experiences.every((item) => item.trim()) && (
                        <motion.article
                            key="add_experience"
                            layout
                            transition={{ layout: PROFILE_BLOCK_LAYOUT }}
                            onClick={handleAddExperience}
                            className={[
                                'profile-block profile-block-add p-6 cursor-pointer',
                                ADD_EXPERIENCE_BLOCK.span,
                                ADD_EXPERIENCE_BLOCK.minHeight,
                            ].join(' ')}
                        >
                            <h2 className="profile-block-title text-gray-900 dark:text-gray-100">
                                {ADD_EXPERIENCE_BLOCK.title}
                            </h2>
                            <Plus
                                className="w-8 h-8 text-gray-400 dark:text-gray-500 self-end"
                                strokeWidth={2}
                                aria-hidden
                            />
                        </motion.article>
                    )}

                    {PROFILE_BLOCKS.filter((block) => block.id !== 'avatar').map((block) => {
                        const filled = isBlockFilled(block.id, profile)
                        const open = openBlock === block.id
                        return renderMosaicTile(
                            block.id,
                            block.title,
                            block.span,
                            block.minHeight,
                            open,
                            filled,
                            () => setOpenBlock(open ? null : block.id),
                            renderBlockEditor(block.id),
                        )
                    })}
                </div>
                </LayoutGroup>

                <div className="flex justify-end mt-6">
                    <Button type="button" loading={isSaving} onClick={() => void handleSave()}>
                        <Save className="w-5 h-5" /> Сохранить
                    </Button>
                </div>
            </div>

            {showHHModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md iv-surface border border-gray-200 dark:border-gray-600 p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Импорт из hh.ru</h2>
                                <p className="text-sm text-secondary mt-1">
                                    Через официальный API HeadHunter (OAuth). Будут подтянуты аватар, опыт, о себе, образование и уровень английского.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-icon"
                                aria-label="Закрыть"
                                onClick={() => setShowHHModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-secondary mb-2 block">
                                Ссылка на резюме (необязательно)
                            </label>
                            <input
                                type="url"
                                value={resumeURL}
                                onChange={(e) => setResumeURL(e.target.value)}
                                className="input-field"
                                placeholder="https://hh.ru/resume/..."
                            />
                            <p className="text-xs text-secondary mt-2">
                                Если не указать, возьмём первое опубликованное резюме из вашего аккаунта.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowHHModal(false)}>
                                Отмена
                            </Button>
                            <Button type="button" loading={isImportingHH} onClick={handleStartHHImport}>
                                <Download className="w-4 h-4" />
                                Войти через hh.ru
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    )
}
