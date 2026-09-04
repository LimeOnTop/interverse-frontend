import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    User,
    Briefcase,
    GraduationCap,
    Languages,
    FileText,
    Image,
    Save,
    Upload,
    X,
    Download,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import ModernSelect from '../components/ModernSelect'
import toast from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

interface ProfileData {
    work_experience: string
    avatar_url: string
    about_me: string
    higher_education: string
    english_level: string
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
    work_experience: '', avatar_url: '', about_me: '', higher_education: '', english_level: '',
}

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
    const [searchParams, setSearchParams] = useSearchParams()
    const [profile, setProfile] = useState<ProfileData>(emptyProfile)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)
    const [isImportingHH, setIsImportingHH] = useState(false)
    const [avatarError, setAvatarError] = useState(false)
    const [showHHModal, setShowHHModal] = useState(false)
    const [resumeURL, setResumeURL] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const hhImportStartedRef = useRef(false)

    useEffect(() => { if (user?.id) fetchProfile() }, [user?.id])

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
                setProfile({
                    work_experience: data.profile.work_experience || '',
                    avatar_url: data.profile.avatar_url || '',
                    about_me: data.profile.about_me || '',
                    higher_education: data.profile.higher_education || '',
                    english_level: data.profile.english_level || '',
                })
                setAvatarError(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка загрузки')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field: keyof ProfileData, value: string) => {
        setProfile((p) => ({ ...p, [field]: value }))
    }

    const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''

        if (!file) return

        try {
            setIsProcessingAvatar(true)
            const dataUrl = await compressImageFile(file)
            setProfile((p) => ({ ...p, avatar_url: dataUrl }))
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
                work_experience: imported.work_experience || '',
                avatar_url: imported.avatar_url || '',
                about_me: imported.about_me || '',
                higher_education: imported.higher_education || '',
                english_level: imported.english_level || '',
            })
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return
        try {
            setIsSaving(true)
            await api.put(`/users/${user.id}/profile`, profile)
            toast.success('Профиль сохранён')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка сохранения')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <Spinner size="lg" className="h-64" />

    return (
        <PageTransition>
            <PageHeader
                title="Профиль"
                description="Данные для персонализации тренировок"
                action={
                    <Button
                        type="button"
                        loading={isImportingHH}
                        onClick={() => setShowHHModal(true)}
                    >
                        <Download className="w-5 h-5" />
                        Импортировать из hh.ru
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="max-w-form">
                <FormCard className="space-y-6">
                    <div className="flex items-start gap-6">
                        <div className="shrink-0">
                            {profile.avatar_url && !avatarError ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Аватар"
                                    className="w-20 h-20 object-cover border border-gray-200 dark:border-gray-600"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-gray-600">
                                    <User className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                <Image className="w-4 h-4" /> Аватар
                            </label>
                            <p className="text-sm text-secondary mb-3">
                                Выберите фото с устройства — оно будет автоматически сжато.
                                Поддерживаются JPEG, PNG и WebP (исходный файл до 25 МБ).
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

                    <div className="iv-divider" />

                    {[
                        { key: 'about_me' as const, label: 'О себе', icon: FileText, rows: 4, placeholder: 'Кратко о себе...' },
                        { key: 'work_experience' as const, label: 'Опыт работы', icon: Briefcase, rows: 4, placeholder: 'Профессиональный опыт...' },
                    ].map(({ key, label, icon: Icon, rows, placeholder }) => (
                        <div key={key}>
                            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                <Icon className="w-4 h-4" /> {label}
                            </label>
                            <textarea value={profile[key]} onChange={(e) => handleChange(key, e.target.value)} className="input-field min-h-[100px] resize-y" rows={rows} placeholder={placeholder} />
                        </div>
                    ))}

                    <div>
                        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            <GraduationCap className="w-4 h-4" /> Высшее образование
                        </label>
                        <input type="text" value={profile.higher_education} onChange={(e) => handleChange('higher_education', e.target.value)} className="input-field" placeholder="ВУЗ, специальность" />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            <Languages className="w-4 h-4" /> Английский
                        </label>
                        <ModernSelect options={ENGLISH_LEVELS} value={profile.english_level} onChange={(v) => handleChange('english_level', v)} placeholder="Уровень" />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={isSaving}><Save className="w-5 h-5" /> Сохранить</Button>
                    </div>
                </FormCard>
            </form>

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
