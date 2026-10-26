import '../styles/subscription.css'
import { useEffect, useRef, useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import Button from './ui/Button'
import { PRO_FEATURES, formatRub, type PaidOffer } from '../utils/subscription'

export default function ProCheckoutDialog({ offer, busy, available, settingsError, onClose, onPay }: {
    offer: PaidOffer; busy: boolean; available: boolean | null; settingsError: string; onClose: () => void; onPay: () => void
}) {
    const [consent, setConsent] = useState(false)
    const trial = offer.id === 'trial_3d'
    const dialog = useRef<HTMLDialogElement>(null)
    const title = useRef<HTMLHeadingElement>(null)
    useEffect(() => {
        const element = dialog.current
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const previousOverflow = document.body.style.overflow
        element?.showModal()
        title.current?.focus({ preventScroll: true })
        document.body.style.overflow = 'hidden'
        return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus() }
    }, [])
    return <dialog ref={dialog} className="pro-checkout" aria-labelledby="pro-checkout-title"
        onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
        onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
        <div className="iv-form-card pro-checkout__card p-5 sm:p-8">
            <button type="button" className="pro-checkout__close" aria-label="Закрыть окно оплаты" onClick={onClose} disabled={busy}><X size={20} /></button>
            {trial ? (
                <>
                <h2 ref={title} tabIndex={-1} id="pro-checkout-title" className="pr-9 text-2xl sm:text-3xl font-bold text-inter-verse-green dark:text-purple-300">Попробуй Pro за 1 ₽</h2>
                <p className="mt-3 text-sm text-secondary">Полный доступ к Pro на 3 дня: все тренировки по System Design, подробные отчёты, разбор ответов и до 15 тренировок в день.</p>
                <ul className="grid gap-3 mt-5">
                    {PRO_FEATURES.slice(0, 4).map(feature => <li key={feature} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"><Check size={18} className="shrink-0 mt-0.5 text-inter-verse-green dark:text-purple-300" /><span>{feature}</span></li>)}
                </ul>
                </>
            ) : <>
            <span className="iv-pro-badge iv-pill-accent inline-flex items-center gap-2"><Sparkles size={16} /> InterVerse Pro</span>
            <h2 ref={title} tabIndex={-1} id="pro-checkout-title" className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Больше практики. Понятнее следующий шаг.</h2>
            <p className="mt-3 text-sm text-secondary">{offer.description}</p>
            <ul className="grid gap-3 mt-5">
                {(trial ? PRO_FEATURES.slice(0, 4) : PRO_FEATURES).map(feature => <li key={feature} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"><Check size={18} className="shrink-0 mt-0.5 text-inter-verse-green dark:text-purple-300" /><span>{feature}</span></li>)}
            </ul>
            <div className="pro-checkout__price mt-6 p-4 flex items-center justify-between gap-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{offer.name}<span className="block text-xs text-secondary mt-1">{trial ? '72 часа доступа' : `${offer.durationDays} дней доступа`}</span></span>
                <strong className="text-2xl whitespace-nowrap text-gray-900 dark:text-gray-100">{formatRub(offer.price)}</strong>
            </div>
            </>}
            <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-gray-900 dark:text-gray-100">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
                <span>{trial ? 'Согласен на оплату 1 ₽ за 3 дня, затем — автоматические списания 390 ₽ каждый месяц до отмены.' : available ? `Я согласен на автоматические списания: ${formatRub(offer.price)} каждые ${offer.durationDays} дней.` : `Я согласен на разовую оплату ${formatRub(offer.price)} за ${trial ? '72 часа доступа' : `${offer.durationDays} дней доступа`}.`} Принимаю <a href="/legal/oferta.html#renewal" target="_blank" rel="noopener noreferrer" className="underline">условия оферты</a>. Автопродление можно отключить в профиле до следующего списания.</span>
            </label>
            <Button type="button" className="w-full justify-center mt-5" loading={busy} disabled={!consent || available === null || (trial && !available)} onClick={onPay}>{trial ? 'Перейти к оплате' : `Оплатить ${formatRub(offer.price)}`} </Button>
            {!trial && <p className="mt-3 text-xs text-secondary leading-relaxed">Успешная оплата подтверждается Робокассой. Доступ сохраняется до конца оплаченного периода даже после отключения автопродления.</p>}

            {available === null && <p role="status" className="mt-3 text-xs text-secondary">{settingsError || 'Загружаем настройки оплаты…'}</p>}
            {available === false && !trial && <p className="mt-3 text-xs text-secondary">Сейчас автоматические списания ещё не подключены. Эта оплата будет разовой; автопродление станет доступно после подключения сервиса и новой оплаты с привязкой карты.</p>}
        </div>
    </dialog>
}
