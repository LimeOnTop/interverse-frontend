import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync(new URL('../src/lib/trainingWizard.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {supportsPracticalTasks,trainingWizardSteps,resolveWizardStep,effectiveTaskMode}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
test('QA tools and frameworks do not expose the tasks step',()=>{
 for(const technology of ['Postman','Selenium','Playwright','Cypress','JUnit','Node.js','Django','Kubernetes','HTML5','CSS3']) {
  assert.equal(supportsPracticalTasks([technology]),false,technology)
  assert.deepEqual(trainingWizardSteps([technology]).map(s=>s.id),[1,2,3,5])
 }
})
test('programming languages, Docker and React expose tasks in their original position',()=>{
 for(const technology of ['Python','JavaScript','TypeScript','Java','Go','C#','PHP','Ruby','Rust','R','SQL','Docker','React',' golang ']) {
  assert.equal(supportsPracticalTasks([technology]),true,technology)
  assert.deepEqual(trainingWizardSteps(['Postman',technology]).map(s=>s.id),[1,2,3,4,5])
 }
})
test('removing last eligible technology clears stale tasks including saved and scheduled drafts',()=>{
 assert.equal(effectiveTaskMode(['Selenium','Python'],'many'),'many')
 assert.equal(effectiveTaskMode(['Selenium'],'many'),'theory')
 assert.equal(effectiveTaskMode(['Postman'],'few'),'theory')
 assert.equal(effectiveTaskMode(['Python'],'unexpected'),'theory')
})
test('old task-step draft opens summary and Back returns to level when tasks are hidden',()=>{
 assert.equal(resolveWizardStep(4,['Postman']),5)
 const steps=trainingWizardSteps(['Postman']);const current=steps.findIndex(s=>s.id===resolveWizardStep(4,['Postman']))
 assert.equal(steps[current-1].id,3)
 assert.equal(resolveWizardStep(4,['React']),4)
 assert.equal(resolveWizardStep(NaN,['React']),1)
 assert.equal(resolveWizardStep(100,['Postman']),5)
})
