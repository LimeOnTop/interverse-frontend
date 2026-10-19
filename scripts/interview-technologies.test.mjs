import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/lib/interviewSession.ts',import.meta.url),'utf8').replace(/^import .* from '.\/privateStorage'\n/,'')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {buildSessionSteps}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
test('question badges retain their own source technology after sorting and task interleaving',()=>{
 const questions=['Go','Kafka','PostgreSQL','Redis'].map((technology,n)=>({id:`q${n}`,question_id:`source${n}`,text:`${technology} question`,technology,sort_order:n,item_type:'question'})).reverse()
 const tasks=[{id:'task',questionId:'task-source',text:'Go task',technology:'Go',itemType:'task',sortOrder:0}]
 const steps=buildSessionSteps(questions,tasks)
 for(const step of steps){const source=[...questions,...tasks].find(item=>item.id===step.id);assert.equal(step.technology,source.technology);assert.equal(step.questionId,source.questionId||source.question_id)}
 assert.deepEqual(steps.filter(s=>s.type==='question').map(s=>s.technology),['Go','Kafka','PostgreSQL','Redis'])
})
