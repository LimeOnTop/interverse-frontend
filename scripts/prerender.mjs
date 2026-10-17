import {build} from 'vite'
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises'
import {resolve} from 'node:path'
const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'))
const serverDir=resolve('.seo-build')
await build({build:{ssr:'src/entry-seo.tsx',outDir:serverDir,emptyOutDir:true},logLevel:'warn'})
const {render,publicPaths}=await import(serverDir+'/entry-seo.js')
const shell=(await readFile('dist/index.html','utf8')).replace(/<main style="max-width:720px;[\s\S]*?<\/main>/,'')
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')
await writeFile('dist/app.html',shell.replace(/(<meta name="robots" content=")[^"]+/, '$1noindex, follow'))
for(const path of publicPaths){
 const pageKey=path==='/pro-trial'?'src/pages/ProTrialPage.tsx':path.startsWith('/jobs/')?'src/pages/PublicJobsPage.tsx':path.startsWith('/preparation/')?'src/pages/PreparationPythonPage.tsx':path==='/jobs'||path==='/preparation'?'src/pages/PublicCatalogPage.tsx':path==='/pricing'?'src/pages/PricingPage.tsx':path==='/about-contractor'?'src/pages/ContractorPage.tsx':path==='/privacy'?'src/pages/PrivacyPage.tsx':null
 const css=new Set();const walk=key=>{const item=manifest[key];if(!item)return;for(const file of item.css||[])css.add(file);for(const dep of item.imports||[])walk(dep)};if(pageKey)walk(pageKey)
 const {body,seo}=render(path);const canonical='https://inter-verse.ru'+path
 let html=shell.replace(/<title>[^<]*<\/title>/,`<title>${esc(seo.title)}</title>`)
 for(const [attr,key,value] of [['name','description',seo.description],['property','og:title',seo.title],['property','og:description',seo.description],['property','og:url',canonical],['name','twitter:title',seo.title],['name','twitter:description',seo.description]]){
 html=html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*`),(_,prefix)=>prefix+esc(value))
 }
 html=html.replace(/(<link rel="canonical" href=")[^"]*/,(_,prefix)=>prefix+canonical)
 html=html.replace(/(<link rel="alternate" hreflang="(?:ru|x-default)" href=")[^"]*/g,(_,prefix)=>prefix+canonical)
 html=html.replace('<div id="root"></div>',`<div id="root">${body}</div>`)
 const graph={"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":canonical+'#page',url:canonical,name:seo.title,description:seo.description,inLanguage:'ru',isPartOf:{'@id':'https://inter-verse.ru/#website'}},...(path==='/'?[]:[{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:'InterVerse',item:'https://inter-verse.ru/'},{"@type":"ListItem",position:2,name:seo.title,item:canonical}]}])]}
 for(const file of css)if(!html.includes('/'+file))html=html.replace('</head>',`<link rel="stylesheet" href="/${file}">\n</head>`)
 html=html.replace('</head>',`<script type="application/ld+json">${JSON.stringify(graph).replaceAll('<','\\u003c')}</script>\n</head>`)
 if(path.startsWith('/jobs/'))html=html.replace('</body>','<!--PUBLIC_JOB_DATA-->\n</body>')
 const dir=path==='/'?'dist':'dist'+path;await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html)
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map(path=>`  <url><loc>https://inter-verse.ru${path}</loc></url>`).join('\n')}\n</urlset>\n`)
await rm(serverDir,{recursive:true,force:true})
console.log(`Prerendered ${publicPaths.length} public pages with unique metadata.`)
