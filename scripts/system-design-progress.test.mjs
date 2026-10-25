import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {pathToFileURL} from 'node:url'
import {writeFile,mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
test('migration, isolated accounts, fresh device, offline recovery, serialized saves and conflict protection',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sd-sync-'))
 const bundle=await build({stdin:{contents:"export * from './src/features/system-design/progress'; export { EXERCISES } from './src/features/system-design/model'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'mock-api',setup(b){b.onResolve({filter:/store\/authStore$/},()=>({path:'auth',namespace:'auth'}));b.onLoad({filter:/.*/,namespace:'auth'},()=>({contents:'export const useAuthStore={getState:globalThis.testAuth}',loader:'js'}));b.onResolve({filter:/services\/api$/},()=>({path:'api',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const api=globalThis.testAPI',loader:'js'}))}}]})
 const file=path.join(dir,'progress.mjs');await writeFile(file,bundle.outputFiles[0].text)
 let owner='one',offline=false;const db=new Map()
 globalThis.testAuth=()=>({user:{id:owner}})
 globalThis.localStorage={values:new Map(),getItem(k){return this.values.get(k)||null},setItem(k,v){this.values.set(k,v)}}
 globalThis.testAPI={async get(){return {data:[...db.values()].filter(x=>x.owner===owner).map(x=>structuredClone(x))}},async put(_,p){if(offline)throw Error('offline');const key=owner+':'+p.exercise_id,old=db.get(key);if((old?.revision||0)!==p.revision)throw Error('conflict');const data={...structuredClone(p),owner,revision:p.revision+1,completed:old?.completed||p.completed};db.set(key,data);return {data}}}
 const m=await import(pathToFileURL(file));const ex=m.EXERCISES[0];let d=structuredClone(ex.initial)
 localStorage.setItem(m.storageKey('one',ex.id),JSON.stringify({version:1,design:d}));await m.loadProgress('one');assert.equal(db.size,1)
 d.blocks[0].x=333;m.cacheDraft('one',ex,d);await m.saveProgress('one',ex,d);localStorage.values.clear();await m.loadProgress('one');assert.equal(m.accountRecord('one',ex).design.blocks[0].x,333)
 owner='two';await m.loadProgress('two');assert.equal(m.accountRecord('two',ex),undefined);assert.equal(db.size,1)
 owner='one';d=structuredClone(d);d.blocks[0].x=444;m.cacheDraft('one',ex,d);offline=true;await assert.rejects(m.saveProgress('one',ex,d));assert.equal(JSON.parse(localStorage.getItem(m.storageKey('one',ex.id))).pending,true)
 offline=false;await m.loadProgress('one');assert.equal(db.get('one:traffic').design.blocks[0].x,444)
 const a=structuredClone(d),b=structuredClone(d);a.blocks[0].x=500;b.blocks[0].x=600;await Promise.all([m.saveProgress('one',ex,a),m.saveProgress('one',ex,b)]);assert.equal(db.get('one:traffic').design.blocks[0].x,600)
 const draft=structuredClone(b);draft.blocks[0].x=700;m.cacheDraft('one',ex,draft);const other=db.get('one:traffic');other.revision++;other.design.blocks[0].x=800
 await assert.rejects(m.loadProgress('one'));assert.equal(db.get('one:traffic').design.blocks[0].x,800);await m.loadProgress('one',true);assert.ok(localStorage.getItem(m.storageKey('one',ex.id)+':backup'));assert.equal(m.accountRecord('one',ex).design.blocks[0].x,800)
 const delayed=m.saveProgress('one',ex,draft);owner='two';await assert.rejects(delayed);assert.equal(db.has('two:traffic'),false)
})
