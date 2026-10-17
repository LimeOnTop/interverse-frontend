import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Link } from 'react-router-dom'
import { PRO_FEATURES, type PaidOffer } from '../utils/subscription'
export const TRIAL_OFFER: PaidOffer = {id:'trial_3d',name:'Pro · пробные 3 дня',price:'1.00',priceHint:'Затем 390 ₽ в месяц',description:'Полный доступ к Pro на 72 часа: подробные отчёты, разбор ответов и до 15 тренировок в день.',durationDays:3,paid:true,features:PRO_FEATURES}
export default function ProTrialOffer({onSelect}:{onSelect?:()=>void}) { const [available,setAvailable]=useState(false); useEffect(()=>{let active=true;api.get('/payments/offers').then(({data})=>{if(active)setAvailable((data.offers||[]).some((p:{id:string})=>p.id==='trial_3d'))}).catch(()=>{});return()=>{active=false}},[]); return <section className="iv-panel p-5 sm:p-6 my-6" aria-label="Пробная подписка Pro">
<span className="iv-pill-accent">{available ? 'Пробный Pro' : 'Скоро · пробный Pro'}</span>
<h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Попробуй Pro за 1 ₽</h2>
<p className="mt-2 text-secondary">3 дня полного доступа. Затем 390 ₽ каждый календарный месяц с автопродлением до отмены. Отключить можно в профиле, доступ сохранится до конца оплаченного периода.</p>
{onSelect ? <button className="iv-btn-primary mt-4 px-5 py-3 rounded-xl" onClick={onSelect}>Посмотреть условия</button> : <Link className="inline-block mt-4 underline font-medium text-inter-verse-green dark:text-purple-300" to="/pro-trial">Условия пробной подписки</Link>}
<p className="mt-3 text-xs text-secondary">{!available && 'Ожидаем подключения Робокассы. Оплата пробного периода пока недоступна. '} <a className="underline" href="/legal/oferta.html#renewal">Оферта и условия автопродления</a></p>
</section> }
