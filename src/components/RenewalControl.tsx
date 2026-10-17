import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatRub } from '../utils/subscription'
import '../styles/subscription.css'
type Settings = {enabled:boolean;has_mandate:boolean;available:boolean;next_charge_at:string;amount:string;pending:boolean;last_error:string}
export default function RenewalControl(){
 const [settings,setSettings]=useState<Settings|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(false)
 useEffect(()=>{let active=true;api.get('/payments/renewal').then(({data})=>{if(active)setSettings(data)}).catch(()=>{if(active)setError('Не удалось загрузить автопродление. Обнови страницу или напиши info@inter-verse.ru.')});return()=>{active=false}},[])
 const change=async()=>{if(!settings||busy||!settings.has_mandate)return;setBusy(true);setError('');try{const {data}=await api.put('/payments/renewal',{enabled:!settings.enabled});setSettings(data);setConfirmed(!data.enabled)}catch{setError('Изменение не сохранено. Попробуй снова или напиши info@inter-verse.ru.')}finally{setBusy(false)}}
 const enabled=!!settings?.has_mandate&&settings.enabled
 return <section aria-labelledby="renewal-heading" className="iv-panel p-5 mt-5 text-gray-900 dark:text-gray-100">
 <div className="flex items-center justify-between gap-4"><h2 id="renewal-heading" className="font-semibold">Автопродление Pro</h2><button type="button" role="switch" aria-checked={enabled} aria-label="Автопродление Pro" className="renewal-switch" disabled={busy||!settings?.has_mandate||(!enabled&&!settings.available)} onClick={()=>void change()}><span className="renewal-switch__thumb" /></button></div>
 <p className="mt-2 text-sm text-secondary">{!settings ? error||'Загружаем настройки…' : !settings.has_mandate ? 'Автопродление не подключено.' : !settings.enabled ? 'Автопродление отключено. Новых автоматических списаний не будет, оплаченный доступ сохраняется.' : settings.next_charge_at ? `Следующее списание: ${formatRub(settings.amount)} — ${new Date(settings.next_charge_at).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'})} (МСК).` : 'Дата следующего списания появится после подтверждения оплаты.'}</p>
 {settings?.has_mandate&&<p className="mt-2 text-xs text-secondary">Выключи переключатель до отправки следующего платежа. Уже отправленный платёж может завершиться. Для возврата: info@inter-verse.ru.</p>}
 {settings?.pending&&<p role="status" className="mt-2 text-sm">Платёж уже обрабатывается. Отключение остановит последующие списания.</p>}
 {confirmed&&<p role="status" className="mt-3 text-sm">Автопродление успешно отключено.</p>}
 {!!settings&&error&&<p role="alert" className="mt-3 text-sm">{error}</p>}
 {settings?.last_error&&<p role="status" className="mt-2 text-sm">{settings.last_error}</p>}
 <a href="/legal/oferta.html#renewal" className="inline-block mt-3 text-xs underline">Условия, отмена и возвраты</a></section>
}
