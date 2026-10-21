import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import assert from 'node:assert/strict'
const source=await readFile('src/lib/analytics.ts','utf8')
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
let seq=0
async function environment(memory=new Map(), search="") {
 const calls=[]
 globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}
 globalThis.window={location:{hostname:'inter-verse.ru',origin:'https://inter-verse.ru',search},ym:(...args)=>calls.push(args)}
 const a=await import('data:text/javascript;base64,'+Buffer.from(js+'\n// instance '+seq++).toString('base64'))
 return {a,calls,memory,goals:()=>calls.filter(c=>c[1]==='reachGoal')}
}
{
 const {a,calls,goals}=await environment()
 a.trackPage('/pricing');assert.equal(calls.length,0,'no hit before auth resolution')
 a.setAnalyticsIdentity('51');a.trackPage('/pricing');a.trackPricingView('pricing')
 assert.ok(calls.some(c=>c[1]==='setUserID'&&c[2]==='iv_user_51'))
 assert.equal(goals()[0][3].account_id,'iv_user_51')
 a.registrationComplete('51');a.registrationComplete('51');assert.equal(goals().filter(c=>c[2]==='registration_complete').length,1)
 for(const [i,plan] of a.PAYMENT_PLANS.entries()){
  const id=100+i;a.checkoutStarted(id,plan,'51');const count=goals().length
  a.confirmPurchases([],'51');assert.equal(goals().length,count,'pending is not paid')
  a.confirmPurchases([{id,plan,amount:'390',duration_days:30}],'52');assert.equal(goals().length,count,'foreign owner rejected')
  a.confirmPurchases([{id,plan:'pro_track',amount:'390',duration_days:30}],'51');assert.equal(goals().length,count,'wrong product rejected')
  a.confirmPurchases([{id,plan,amount:'390',duration_days:30}],'51');assert.equal(goals().length,count+2)
  a.confirmPurchases([{id,plan,amount:'390',duration_days:30}],'51');assert.equal(goals().length,count+2,'no duplicate payment')
 }
 assert.equal(goals().filter(c=>c[2]==='payment_redirect').length,5)
 assert.ok(goals().filter(c=>c[2]==='payment_redirect').every(c=>c[3].account_id==='iv_user_51'&&c[3].invoice_id))
 a.setAnalyticsIdentity('52');a.checkoutStarted(300,'paid_1m','51');assert.ok(!a.pendingPurchases().some(p=>p.id===300),'stale checkout cannot be assigned to new account')
 a.setAnalyticsIdentity(null);a.trackPricingView('pricing');assert.equal(goals().at(-1)[3].account_id,'anonymous','logout clears event identity')
 window.location.hostname='localhost';const count=calls.length;a.trackPage('/pricing');a.trackPricingView('pricing');assert.equal(calls.length,count,'production only')
 assert.ok(! /"(?:email|password|access_token|refresh_token)"\s*:/.test(JSON.stringify(calls)),'no personal fields or tokens')
}
for(const id of ['3','47']) {
 const {a,calls,memory}=await environment()
 a.registrationFunnel('form_view');a.setAnalyticsIdentity(id)
 a.trackPage('/pricing');a.trackPricingView('pricing');a.registrationComplete(id);a.checkoutStarted(1,'trial_3d',id)
 assert.equal(calls.length,0,'owner does not initialize counter or emit queued events')
 a.setAnalyticsIdentity(null);a.trackPage('/');assert.equal(calls.length,0,'owner browser stays excluded after logout')
 const next=await environment(memory);next.a.setAnalyticsIdentity(null);next.a.trackPricingView('pricing');assert.equal(next.calls.length,0,'exclusion survives reload')
}
{
 const {a,calls}=await environment();a.setAnalyticsIdentity('51');a.trackPage('/')
 const before=calls.length;a.setAnalyticsIdentity('47');assert.equal(calls.at(-1)[1],'destruct')
 a.trackPricingView('subscription');assert.equal(calls.length,before+1,'existing counter destroyed before test activity')
}
{
 const {a,calls}=await environment(new Map(), '?analytics=off')
 a.setAnalyticsIdentity(null);a.trackPage('/pricing');assert.equal(calls.length,0,'fresh test bookmark blocks initial anonymous hit')
}
{
 const {a,calls}=await environment();a.setAnalyticsIdentity('51');window.ym=()=>{throw new Error('blocked')}
 assert.doesNotThrow(()=>a.trackPage('/pricing'));assert.equal(a.trackPricingView('pricing'),false)
 a.checkoutStarted(900,'trial_3d','51');assert.ok(a.pendingPurchases().some(p=>p.id===900))
 a.confirmPurchases([{id:900,plan:'trial_3d',amount:'1',duration_days:3}],'51');assert.ok(a.pendingPurchases().some(p=>p.id===900),'retry blocked analytics later')
}
console.log('PASS: delayed init; numeric user identity; anonymous logout; test IDs 3/47; sticky exclusion/reload; stale account payment isolation; pricing impressions; checkout invoice attribution; confirmed payments/dedup; production-only; no PII')
