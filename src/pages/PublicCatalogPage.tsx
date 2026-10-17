import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'
import { preparations,jobTracks } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'
import '../styles/home.css'
import '../styles/preparation.css'
export default function PublicCatalogPage({jobs=false}:{jobs?:boolean}) {
 const items=jobs ? jobTracks : [pythonPreparation,...preparations]
 return <div className="iv-home iv-preparation"><PublicNav landing/><main className="iv-home-container public-catalog"><span className="iv-eyebrow">{jobs?'ВОЗМОЖНОСТИ ДЛЯ РОСТА':'ОТ ВОПРОСОВ К ПРАКТИКЕ'}</span><h1>{jobs?'Вакансии IT-разработчиков':'Подготовка к IT-собеседованию'}</h1><p>{jobs?'Публичные подборки по технологиям. Сравни требования, проверь источник и подготовься к интервью.':'Выбери направление: открытые вопросы с ответами, практические задачи и тренировка под твой уровень.'}</p><div className="public-catalog-grid">{items.map(item=><Link to={(jobs?'/jobs/':'/preparation/')+item.slug} key={item.slug}><span>{jobs?'ВАКАНСИИ':'ПОДГОТОВКА'}</span><h2>{item.name}<ArrowUpRight size={22}/></h2><p>{item.lead}</p></Link>)}</div><Link to={jobs?'/preparation':'/jobs'} className="iv-landing-text-button">{jobs?'Подготовиться к собеседованию':'Посмотреть вакансии'}<ArrowUpRight size={17}/></Link></main><SiteFooter/></div>
}
