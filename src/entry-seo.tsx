import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import HomePage from './pages/HomePage'
import ProTrialPage from './pages/ProTrialPage'
import PreparationPage from './pages/PreparationPythonPage'
import PublicJobsPage from './pages/PublicJobsPage'
import PublicCatalogPage from './pages/PublicCatalogPage'
import PricingPage from './pages/PricingPage'
import ContractorPage from './pages/ContractorPage'
import PrivacyPage from './pages/PrivacyPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { resolveSeo, PUBLIC_PATHS, serializeStructuredData } from './lib/seo'
import NotFoundPage from './pages/NotFoundPage'
export { serializeStructuredData }
export const publicPaths = PUBLIC_PATHS
export function render(path:string){
 const prep=path.startsWith('/preparation/') ? path.split('/')[2] : null
 const job=path.startsWith('/jobs/') ? path.split('/')[2] : null
 const component=path==='/404'?<NotFoundPage/>:path==='/pro-trial'?<ProTrialPage/>:path==='/'?<HomePage/>:path==='/pricing'?<PricingPage/>:path==='/about-contractor'?<ContractorPage/>:path==='/privacy'?<PrivacyPage/>:prep?<PreparationPage slug={prep}/>:job?<PublicJobsPage slug={job} templateMode/>:<PublicCatalogPage jobs={path==='/jobs'}/>
 return {body:renderToString(<StaticRouter location={path}><ThemeProvider>{component}</ThemeProvider></StaticRouter>),seo:resolveSeo(path)}
}
