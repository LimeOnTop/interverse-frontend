import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const files = new Map()
globalThis.localStorage = { getItem: k => files.get(k) ?? null, setItem: (k,v) => files.set(k,v), removeItem: k => files.delete(k), get length(){return files.size}, key:i=>[...files.keys()][i] }
globalThis.sessionStorage = { ...globalThis.localStorage, get length(){return files.size} }
const listeners = {}
globalThis.window = { location: { protocol: 'http:', pathname: '/login' }, addEventListener: (k,f) => listeners[k] = f }
globalThis.document = { cookie: '' }
files.set('auth-storage', JSON.stringify({ state: { user: { id: '-1', role: 'admin' }, isAuthenticated: true, accessToken: 'old-access', refreshToken: 'old-refresh' }, version: 0 }))
const folder = await mkdtemp(join(tmpdir(), 'iv-auth-test-'))
try {
 const bundle = await build({ stdin: { contents: `export {useAuthStore} from './src/store/authStore'; export {api} from './src/services/api'; export {default as axios} from 'axios';`, resolveDir: resolve('.') }, bundle: true, platform: 'node', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" }, format: 'esm', write: false, define: { 'import.meta.env.VITE_API_URL': '"/api/v1"' } })
 const path = join(folder, 'session.mjs');await writeFile(path,bundle.outputFiles[0].text)
 const {useAuthStore:store,api,axios}=await import(path)
 assert.equal(store.getState().user,null,'cached admin must not be trusted');assert.equal(store.getState().isAuthenticated,false)
 const logoutHeaders=[]
 axios.defaults.adapter=async config=>{logoutHeaders.push(config.headers.Authorization);return {data:{success:true},status:200,headers:{},config}}
 let handler
 api.defaults.adapter=async config=>({data:await handler(config),status:200,headers:{},config})
 handler=async config=>config.url==='/auth/register'?{verification_required:true}:{}
 store.setState({user:{id:'-1',role:'admin'},isAuthenticated:true})
 assert.deepEqual(await store.getState().register('New user','new@example.test','test-password'),{verificationRequired:true})
 assert.equal(store.getState().user,null);assert.equal(store.getState().accessToken,null);assert.equal(store.getState().isAuthenticated,false)
 await new Promise(r=>setImmediate(r));assert.ok(logoutHeaders.includes('Bearer old-access'),'must contact server')
 store.setState({accessToken:'invalid',refreshToken:null,user:{id:'-1',role:'admin'},isAuthenticated:true})
 handler=async()=>{throw new Error('invalid session')}
 await store.getState().checkAuth();assert.equal(store.getState().user,null,'failed validation must clear admin')
 let resolveRefresh
 files.set('interview-answers-fixture', 'private answer');files.set('iv:form:profile:2','private profile');files.set('theme','light')
 store.setState({accessToken:'a',refreshToken:'r'})
 handler=()=>new Promise(r=>resolveRefresh=r)
 const refresh=store.getState().refreshTokens();await new Promise(r=>setImmediate(r))
 await store.getState().logout();assert.equal(files.has('interview-answers-fixture'),false);assert.equal(files.has('iv:form:profile:2'),false);assert.equal(files.get('theme'),'light');resolveRefresh({access_token:'late-a',refresh_token:'late-r'})
 assert.equal(await refresh,false);assert.equal(store.getState().accessToken,null,'late refresh resurrected logout')
 store.setState({accessToken:'new-a',refreshToken:'new-r',user:{id:'2',role:'user'},isAuthenticated:true})
 listeners.storage({key:'auth-storage',newValue:JSON.stringify({state:{accessToken:null,refreshToken:null}})})
 assert.equal(store.getState().user,null,'cross-tab logout must clear identity')
 assert.equal(JSON.parse(files.get('auth-storage')).state.user,undefined,'role must not persist')
 const jwt=(id,sig)=>'e30.'+Buffer.from(JSON.stringify({user_id:id})).toString('base64url')+'.'+sig
 handler=async config=>config.url==='/auth/me'?{user:{id:'2',role:'user'}}:{}
 store.setState({accessToken:jwt(2,'old'),refreshToken:'old-r',user:{id:'2',role:'user'},isAuthenticated:true})
 files.set('iv:form:2:profile','keep draft')
 listeners.storage({key:'auth-storage',newValue:JSON.stringify({state:{accessToken:jwt(2,'new'),refreshToken:'new-r'}})})
 assert.equal(files.get('iv:form:2:profile'),'keep draft','same-account refresh must preserve draft')
 await new Promise(r=>setImmediate(r))
 listeners.storage({key:'auth-storage',newValue:JSON.stringify({state:{accessToken:jwt(3,'other'),refreshToken:'other-r'}})})
 assert.equal(files.has('iv:form:2:profile'),false,'account switch must clear private draft')
 console.log('PASS: cached admin, registration verification, server logout, failed validation, late refresh, cross-tab logout')
}finally{await rm(folder,{recursive:true,force:true})}
