import { build } from 'vite'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const serverDir = resolve('.seo-build')
await build({ build: { ssr: 'src/entry-seo.tsx', outDir: serverDir, emptyOutDir: true }, logLevel: 'warn' })
const { render, publicPaths, serializeStructuredData } = await import(serverDir + '/entry-seo.js')
const shell = (await readFile('dist/index.html', 'utf8'))
    .replace(/<main style="max-width:720px;[\s\S]*?<\/main>/, '')
    .replace(/<div id="root">[\s\S]*<\/div>/, '<div id="root"></div>')
    .replace(/<script id="page-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace(/^[ \t]+$/gm, '')
const esc = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const privateShell = shell
    .replace(/<title>[^<]*<\/title>/, '<title>InterVerse</title>')
    .replace(/(<meta name="robots" content=")[^"]+/, '$1noindex, follow')
    .replace(/\s*<link rel="(?:canonical|alternate)"[^>]*>/g, '')
await writeFile('dist/app.html', privateShell)

for (const path of [...publicPaths, '/404']) {
    const pageKey = path === '/404' ? 'src/pages/NotFoundPage.tsx'
        : path === '/pro-trial' ? 'src/pages/ProTrialPage.tsx'
        : path.startsWith('/jobs/') ? 'src/pages/PublicJobsPage.tsx'
        : path.startsWith('/preparation/') ? 'src/pages/PreparationPythonPage.tsx'
        : path === '/jobs' || path === '/preparation' ? 'src/pages/PublicCatalogPage.tsx'
        : path === '/pricing' ? 'src/pages/PricingPage.tsx'
        : path === '/about-contractor' ? 'src/pages/ContractorPage.tsx'
        : path === '/privacy' ? 'src/pages/PrivacyPage.tsx' : null
    const css = new Set()
    const visited = new Set()
    const walk = key => {
        if (visited.has(key)) return
        visited.add(key)
        const item = manifest[key]
        if (!item) return
        for (const file of item.css || []) css.add(file)
        for (const dep of item.imports || []) walk(dep)
    }
    if (pageKey) walk(pageKey)
    const { body, seo } = render(path)
    const canonical = 'https://inter-verse.ru' + seo.path
    let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(path === '/404' ? 'Страница не найдена — InterVerse' : seo.title)}</title>`)
    for (const [attr, key, value] of [
        ['name', 'description', seo.description], ['property', 'og:title', seo.title],
        ['property', 'og:description', seo.description], ['property', 'og:url', canonical],
        ['name', 'twitter:title', seo.title], ['name', 'twitter:description', seo.description],
    ]) {
        html = html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*`), (_, prefix) => prefix + esc(value))
    }
    html = html.replace(/(<meta name="robots" content=")[^"]*/, (_, prefix) => prefix + (seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'))
    html = html.replace(/(<link rel="canonical" href=")[^"]*/, (_, prefix) => prefix + canonical)
    html = html.replace(/(<link rel="alternate" hreflang="(?:ru|x-default)" href=")[^"]*/g, (_, prefix) => prefix + canonical)
    if (seo.noindex) html = html.replace(/\s*<link rel="(?:canonical|alternate)"[^>]*>/g, '')
    html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    for (const file of css) if (!html.includes('/' + file)) html = html.replace('</head>', `<link rel="stylesheet" href="/${file}">\n</head>`)
    const json = serializeStructuredData(path)
    if (json) html = html.replace('</head>', `<script id="page-structured-data" type="application/ld+json">${json}</script>\n</head>`)
    if (path.startsWith('/jobs/')) html = html.replace('</body>', '<!--PUBLIC_JOB_DATA-->\n</body>')
    if (path === '/404') await writeFile('dist/404.html', html)
    else {
        const dir = path === '/' ? 'dist' : 'dist' + path
        await mkdir(dir, { recursive: true })
        await writeFile(dir + '/index.html', html)
    }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map(path => `  <url><loc>https://inter-verse.ru${path}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile('dist/sitemap.xml', sitemap)
await writeFile('public/sitemap.xml', sitemap)
await rm(serverDir, { recursive: true, force: true })
console.log(`Prerendered ${publicPaths.length} public pages, private shell and a noindex 404 page.`)
