import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/lib/practiceCalendar.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {calendarDays,shiftDay,shiftMonth,reminderAllowed}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
test('calendar starts on Monday and spans six full weeks',()=>{const days=calendarDays('2026-10-19');assert.equal(days.length,42);assert.equal(days[0],'2026-09-28');assert.equal(days[41],'2026-11-08');assert.equal(new Set(days).size,42)})
test('month and keyboard navigation preserve valid leap dates',()=>{assert.equal(shiftMonth('2028-01-31',1),'2028-02-29');assert.equal(shiftMonth('2028-02-29',12),'2029-02-28');assert.equal(shiftDay('2026-12-31',1),'2027-01-01')})
test('email is available strictly earlier than one hour before practice',()=>{const now=Date.parse('2026-10-19T10:00:00Z');assert.equal(reminderAllowed('2026-10-19T11:00:01Z',now),true);assert.equal(reminderAllowed('2026-10-19T11:00:00Z',now),false);assert.equal(reminderAllowed('2026-10-19T10:30:00Z',now),false);assert.equal(reminderAllowed('',now),false)})
