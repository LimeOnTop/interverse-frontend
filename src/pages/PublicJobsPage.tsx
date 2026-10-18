import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Briefcase, Search } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import ReportPreview from '../components/ReportPreview'
import SiteFooter from '../components/SiteFooter'
import { api } from '../services/api'
import { jobTracks } from '../data/preparation'
import { useLandingMotion } from '../hooks/useLandingMotion'
import type { VacancyCardData } from '../components/VacancyCard'
import '../styles/home.css'
import '../styles/preparation.css'
import '../styles/public-jobs.css'
export interface PublicFeed {track:string;items:VacancyCardData[];updated_at:string;partial:boolean;stale:boolean}
function initialFeed(slug:string): PublicFeed | null {
 if (typeof document === 'undefined') return null
 try { const data=JSON.parse(document.getElementById('public-jobs-data')?.textContent || 'null'); return data?.track === slug ? data : null } catch { return null }
}
function salary(job:VacancyCardData) {
 const number=(v:number)=>v.toLocaleString('ru-RU')
 const currency=job.salary_currency === 'RUR'||job.salary_currency === 'RUB' ? '₽' : job.salary_currency || ''
 if(job.salary_from != null && job.salary_to != null) return `${number(job.salary_from)}–${number(job.salary_to)} ${currency}`
 if(job.salary_from != null) return `от ${number(job.salary_from)} ${currency}`
 if(job.salary_to != null) return `до ${number(job.salary_to)} ${currency}`
 return 'Зарплата не указана'
}
export default function PublicJobsPage({slug,templateMode=false}:{slug:string;templateMode?:boolean}) {
 const track=jobTracks.find(item=>item.slug===slug)!
 const root=useRef<HTMLDivElement>(null);useLandingMotion(root)
 const [feed,setFeed]=useState<PublicFeed|null>(()=>initialFeed(slug))
 const [loading,setLoading]=useState(!feed);const [error,setError]=useState('');const [retry,setRetry]=useState(0)
 const [shown,setShown]=useState(20)
 const [params,setParams]=useSearchParams()
 const query=params.get('q')||''
 const mode=params.get('format')==='remote'?'remote':'all'
 const level=params.get('experience')==='junior'?'junior':'all'
 const filter=(key:string,value:string)=>{const next=new URLSearchParams(params);if(value&&value!=='all')next.set(key,value);else next.delete(key);setShown(20);setParams(next,{replace:true})}
 useEffect(()=>{let alive=true; setLoading(true);setError('')
 api.get<PublicFeed>('/public/jobs/'+slug).then(({data})=>{if(alive)setFeed(data)}).catch(()=>{if(alive)setError('Не удалось обновить подборку. Попробуй ещё раз.')}).finally(()=>{if(alive)setLoading(false)})
 return()=>{alive=false}
 },[slug,retry])
 const items=(feed?.items||[]).filter(job=>{
 const text=[job.title,job.company_name,...(job.skills||[])].join(' ').toLowerCase()
 const experience=[job.title,job.experience].join(' ').toLowerCase()
 return text.includes(query.trim().toLowerCase()) && (mode==='all'||/удал|remote|дистанц/.test(job.schedule||'')) && (level==='all'||/junior|джун|без опыта|нет опыта|стаж[её]р|noexperience|no experience/i.test(experience))
 })
 return <div className="iv-home iv-preparation" ref={root}><PublicNav landing/><main>
 <nav className="iv-home-container prep-breadcrumb" aria-label="Хлебные крошки"><Link to="/">Главная</Link><span aria-hidden="true">/</span><Link to="/jobs">IT-вакансии</Link><span aria-hidden="true">/</span><span aria-current="page">{track.name}</span></nav>
 <section className="iv-home-container public-jobs-hero"><span className="iv-eyebrow">РАБОТА И СЛЕДУЮЩИЙ ШАГ</span><h1>Вакансии {track.name}.<br/><em>Работа по твоему стеку.</em></h1><p>{track.lead}</p><nav className="prep-related" aria-label="Направления вакансий">{jobTracks.map(item=><Link key={item.slug} to={'/jobs/'+item.slug} aria-current={item.slug===slug?'page':undefined}>Вакансии {item.name}</Link>)}</nav><Link to={'/preparation/'+track.prep} className="iv-landing-button">Подготовиться к собеседованию <ArrowRight size={18}/></Link></section>
 <div className="iv-home-container public-jobs-layout"><section className="public-jobs-list" aria-label={'Подборка вакансий '+track.name}>
 <div className="public-job-filters"><label><span>Поиск по подборке</span><div><Search size={17}/><input type="search" value={query} onChange={e=>filter('q',e.target.value)} placeholder="Название, компания или навык"/></div></label><label><span>Формат</span><select value={mode} onChange={e=>filter('format',e.target.value)}><option value="all">Любой формат</option><option value="remote">Удалённо</option></select></label><label><span>Уровень</span><select value={level} onChange={e=>filter('experience',e.target.value)}><option value="all">Любой опыт</option><option value="junior">Junior / без опыта</option></select></label></div>
 <div className="public-feed-status" aria-live="polite">{loading ? 'Обновляем подборку…' : feed?.updated_at ? `${items.length} в подборке · обновлено ${new Date(feed.updated_at).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'})}` : ''}{feed?.stale && <span>Показана сохранённая подборка. Проверь актуальность у источника.</span>}{feed?.partial&&<span>Часть источников временно недоступна.</span>}</div>
 {error&&<div role="alert" className="public-feed-error">{error}<button onClick={()=>setRetry(n=>n+1)}>Повторить</button></div>}
 {templateMode ? <div dangerouslySetInnerHTML={{__html:'<!--PUBLIC_JOB_CARDS-->'}}/> : <div>{items.slice(0,shown).map(job=><article className="public-job" key={job.id}><div className="public-job-meta">{job.source_label||job.source}{job.area&&' · '+job.area}</div><h2><a href={job.url} target="_blank" rel="noopener noreferrer">{job.title}</a></h2><p className="public-job-company">{job.company_name}</p><div className="public-job-salary">{salary(job)}{job.salary_gross!=null&&<small>{job.salary_gross?'До вычета налогов':'На руки'}</small>}</div><p>{job.snippet}</p><div className="public-job-meta">{[job.experience,job.schedule].filter(Boolean).join(' · ')}</div>{job.skills?.length ? <div className="public-job-skills">{job.skills.slice(0,6).map(skill=><span key={skill}>{skill}</span>)}</div>:null}<a className="public-job-source" href={job.url} target="_blank" rel="noopener noreferrer">Открыть вакансию у источника <ArrowRight size={15}/></a></article>)}{items.length>shown&&<button className="iv-landing-button" onClick={()=>setShown(n=>n+20)}>Показать ещё 20 вакансий <ArrowRight size={17}/></button>}{!loading&&feed&&items.length===0&&<p className="public-feed-empty">По выбранным условиям вакансий нет. Попробуй другой фильтр или соседнее направление.</p>}</div>}
 </section><aside className="public-jobs-aside"><Briefcase size={24}/><h2>Требования —<br/>твой план подготовки.</h2><p>Сравни стек и ожидаемый опыт в вакансии. Затем пройди тренировку и разбери темы, в которых сомневаешься.</p><Link to={'/preparation/'+track.prep} className="iv-landing-button">Практика {track.name}<ArrowRight size={17}/></Link><Link to="/register">Создать аккаунт для личного подбора</Link></aside></div>
 <section className="iv-home-container prep-bottom"><h2>Как выбрать вакансию {track.name}?</h2><p>Сверь обязанности, стек, требования к опыту и формат работы. Если зарплата не указана, уточни её у работодателя. Открой источник объявления, чтобы проверить актуальность и условия отклика.</p><div className="prep-related"><Link to="/jobs">Все направления</Link>{jobTracks.filter(t=>t.slug!==slug).map(t=><Link key={t.slug} to={'/jobs/'+t.slug}>Вакансии {t.name}</Link>)}</div></section>
 <ReportPreview slug={track.prep} ctaHref={"/preparation/"+track.prep+"#training"}/></main><SiteFooter/></div>
}
