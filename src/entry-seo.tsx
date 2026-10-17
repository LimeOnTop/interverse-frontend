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
import { preparations,jobTracks } from './data/preparation'
import { pythonPreparation } from './data/pythonPreparation'
import { resolveSeo } from './components/SeoHead'
export const publicPaths=['/','/pro-trial','/pricing','/privacy','/about-contractor','/preparation','/jobs',...[pythonPreparation,...preparations].map(item=>'/preparation/'+item.slug),...jobTracks.map(item=>'/jobs/'+item.slug)]
export function render(path:string){
 const prep=path.startsWith('/preparation/') ? path.split('/')[2] : null
 const job=path.startsWith('/jobs/') ? path.split('/')[2] : null
 const component=path==='/pro-trial'?<ProTrialPage/>:path==='/'?<HomePage/>:path==='/pricing'?<PricingPage/>:path==='/about-contractor'?<ContractorPage/>:path==='/privacy'?<PrivacyPage/>:prep?<PreparationPage slug={prep}/>:job?<PublicJobsPage slug={job} templateMode/>:<PublicCatalogPage jobs={path==='/jobs'}/>
 return {body:renderToString(<StaticRouter location={path}><ThemeProvider>{component}</ThemeProvider></StaticRouter>),seo:resolveSeo(path)}
}
