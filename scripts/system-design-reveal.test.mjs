import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtemp,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {pathToFileURL} from 'node:url'
import path from 'node:path'

const bundle=await build({entryPoints:['src/features/system-design/boardReveal.ts'],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'animation-fakes',setup(b){b.onResolve({filter:/^(html-to-image|ascii-reveal\/core)$/},a=>({path:a.path,namespace:'fake'}));b.onLoad({filter:/.*/,namespace:'fake'},a=>({contents:a.path==='html-to-image'?'export const toCanvas=(...a)=>globalThis.captureBoard(...a)':'export const createAsciiReveal=(...a)=>globalThis.animateBoard(...a)',loader:'js'}))}}]})
const dir=await mkdtemp(path.join(tmpdir(),'sd-reveal-'));const file=path.join(dir,'reveal.mjs');await writeFile(file,bundle.outputFiles[0].text);const {createBoardReveal}=await import(pathToFileURL(file))
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function fixture(){
 const children=[];const root={dataset:{sdRevealPreparing:'true'},scrollLeft:0,scrollTop:0,clientLeft:1,clientTop:1,getBoundingClientRect:()=>({left:10,top:20}),append(e){children.push(e)}}
 const board={dataset:{},getBoundingClientRect:()=>({left:11,top:82,width:720,height:800})}
 globalThis.window={devicePixelRatio:2};globalThis.document={createElement:()=>({style:{},setAttribute(){},append(){},remove(){children.pop()}})}
 const canvas={style:{}};globalThis.captureBoard=async()=>canvas
 globalThis.animateBoard=()=>({reveal:async()=>{},hide:async()=>{},destroy(){}})
 return {root,board,children,canvas}
}
test('snapshot animates in board coordinates and hands off without leaving an overlay',async()=>{
 const f=fixture();let overlay
 globalThis.animateBoard=(el)=>{overlay=el;return {reveal:async()=>{},hide:async()=>{},destroy(){}}}
 const ctrl=createBoardReveal(f.root,f.board);await ctrl.reveal()
 assert.equal(overlay.style.left,'0px');assert.equal(overlay.style.top,'61px');assert.equal(overlay.style.width,'720px');assert.equal(f.canvas.style.width,'720px');assert.equal(f.children.length,0);assert.equal(f.board.dataset.sdSnapshotHidden,undefined);assert.equal(f.root.dataset.sdRevealPhase,'ready')
})
test('late snapshot completion after unmount cannot hide or overwrite the live board',async()=>{
 const f=fixture(),capture=deferred();globalThis.captureBoard=()=>capture.promise
 const ctrl=createBoardReveal(f.root,f.board),job=ctrl.reveal();ctrl.destroy();capture.resolve(f.canvas);await job
 assert.equal(f.children.length,0);assert.equal(f.board.dataset.sdSnapshotHidden,undefined)
})
test('capture failure leaves the actual board usable',async()=>{
 const f=fixture();globalThis.captureBoard=async()=>{throw Error('unsupported SVG')}
 await createBoardReveal(f.root,f.board).reveal();assert.equal(f.board.dataset.sdSnapshotHidden,undefined);assert.equal(f.root.dataset.sdRevealPreparing,undefined);assert.equal(f.root.dataset.sdRevealPhase,'ready')
})
test('interrupted animation releases the live board without a stale overlay',async()=>{
 const f=fixture(),running=deferred();globalThis.animateBoard=()=>({reveal:()=>running.promise,hide:async()=>{},destroy(){running.resolve()}})
 const ctrl=createBoardReveal(f.root,f.board),job=ctrl.reveal();await new Promise(r=>setImmediate(r));assert.equal(f.board.dataset.sdSnapshotHidden,'true');ctrl.destroy();await job;assert.equal(f.children.length,0);assert.equal(f.board.dataset.sdSnapshotHidden,undefined)
})
