import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { ref, computed, reactive } from 'vue'
const source = fs.readFileSync(new URL('../src/components/ops/WatchfacePushCalendar.vue', import.meta.url),'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'')
const code = ts.transpileModule(source,{ compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
function setup() {
  const writes=[], errors=[]
  const settings={enabled:true,sendTime:'09:00',templateId:'saved',source:'Wristo',selectionMode:'AUTO',appId:null}
  const api={getWatchfacePushCalendar:async()=>({code:0,data:[]}),saveWatchfacePushPlan:async(...args)=>{writes.push(args);return {code:0}},cancelWatchfacePushPlan:async()=>({code:0})}
  const context={ref,computed,reactive,watch(){},defineProps:()=>({settings,revision:0}),ElMessage:{error:e=>errors.push(e),warning:e=>errors.push(e),success(){}},ElMessageBox:{confirm:async()=>true},...Object.fromEntries(Object.keys(api).map(k=>[k,(...args)=>api[k](...args)]))}
  return {...new Function(...Object.keys(context),code+';return {selected,day,tasks,error,loading,load,edit,save,appId,draft,dialog,daily};')(...Object.values(context)),api,writes,errors}
}
test('month request races cannot overwrite the selected month or hide its loading state', async()=>{
  const h=setup();let first,second
  h.api.getWatchfacePushCalendar=()=>new Promise(r=>first=r)
  const a=h.load()
  h.api.getWatchfacePushCalendar=()=>new Promise(r=>second=r)
  const b=h.load()
  first({code:0,data:[{taskId:'old'}]});await a
  assert.equal(h.loading.value,true);assert.deepEqual(h.tasks.value,[])
  second({code:0,data:[{taskId:'new'}]});await b
  assert.equal(h.tasks.value[0].taskId,'new');assert.equal(h.loading.value,false)
})
test('editor freezes selected date and saves a manual plan with saved template',async()=>{
  const h=setup();h.selected.value=new Date('2099-04-20T12:00:00');h.edit()
  h.appId.value=42;h.selected.value=new Date('2099-04-21T12:00:00');await h.save()
  assert.equal(h.writes[0][0],'2099-04-20');assert.equal(h.writes[0][1].appId,42)
  assert.equal(h.writes[0][1].selectionMode,'MANUAL');assert.equal(h.writes[0][1].templateId,'saved')
})
test('failed refresh clears stale data and exposes error',async()=>{
  const h=setup();h.tasks.value=[{taskId:'old'}];h.api.getWatchfacePushCalendar=async()=>{throw Error('offline')}
  await h.load();assert.deepEqual(h.tasks.value,[]);assert.equal(h.error.value,'offline')
})
