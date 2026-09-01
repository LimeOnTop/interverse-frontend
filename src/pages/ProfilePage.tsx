import { useState, useEffect } from 'react'
import { User, Briefcase, GraduationCap, Languages, FileText, Image, Save } from 'lucide-react'
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

export default function ProfilePage() {
    const user = useAuthStore((s) => s.user)
    const [profile, setProfile] = useState<ProfileData>(emptyProfile)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [avatarError, setAvatarError] = useState(false)

    useEffect(() => { if (user?.id) fetchProfile() }, [user?.id])

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
        if (field === 'avatar_url') setAvatarError(false)
        setProfile((p) => ({ ...p, [field]: value }))
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
            <PageHeader title="Профиль" description="Данные для персонализации тренировок" />

            <form onSubmit={handleSubmit} className="max-w-form">
                <FormCard className="space-y-6">
                    <div className="flex items-start gap-6">
                        <div className="shrink-0">
                            {profile.avatar_url && !avatarError ? (
                                <img src={profile.avatar_url} alt="" className="w-20 h-20 object-cover border border-gray-200 dark:border-gray-600" onError={() => setAvatarError(true)} />
                            ) : (
                                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-gray-600">
                                    <User className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                <Image className="w-4 h-4" /> Аватар (URL)
                            </label>
                            <input type="url" value={profile.avatar_url} onChange={(e) => handleChange('avatar_url', e.target.value)} className="input-field" placeholder="https://..." />
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
        </PageTransition>
    )
}
