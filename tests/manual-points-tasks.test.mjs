import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/components/ManualPointsTasks.vue',import.meta.url),'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'')
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
function setup() {
  const writes=[],warnings=[]
  const api={
    getManualTaskConfig:async()=>({code:0,data:[{kind:'REVIEW',points:50,enabled:false}]}),
    saveManualTaskConfig:async data=>{writes.push(data);return {code:0,data}},
    getManualTasks:async()=>({code:0,data:{items:[],total:0}}),
    reviewManualTask:async(id,approve,reason)=>{writes.push({id,approve,reason});return {code:0,data:{id,status:approve?'APPROVED':'REJECTED'}}},
    getManualTaskEvidence:async()=>({code:0,data:{imageBase64:'AA=='}}),
  }
  const context={ref:value=>({value}),onMounted(){},ElMessage:{warning:m=>warnings.push(m),success(){}},ElMessageBox:{confirm:async()=>true},...Object.fromEntries(Object.keys(api).map(key=>[key,(...args)=>api[key](...args)]))}
  return {...new Function(...Object.keys(context),`${code}; return { configs, configError, configSaving, items, selected, error, busy, reason, dialog, image, evidenceError, loadConfig, saveConfig, load, open, review };`)(...Object.values(context)),api,writes,warnings}
}
test('configuration loads authoritative values and rejects invalid amount',async()=>{
  const h=setup();await h.loadConfig();assert.equal(h.configs.value[0].enabled,false)
  for(const points of [0,1.5,100001,NaN])await h.saveConfig({kind:'REVIEW',points,enabled:true})
  assert.equal(h.writes.length,0);await h.saveConfig({kind:'REVIEW',points:25,enabled:true});assert.equal(h.writes[0].points,25)
})
test('reject requires reason and approval carries only id decision and reason',async()=>{
  const h=setup();await h.open({id:'a',kind:'REVIEW',points:30,status:'PENDING',hasImage:false})
  await h.review(false);assert.equal(h.writes.length,0)
  await h.review(true);assert.deepEqual(h.writes,[{id:'a',approve:true,reason:''}]);assert.equal(h.dialog.value,false)
})
test('duplicate review clicks send only one mutation',async()=>{
  const h=setup();let finish;h.api.reviewManualTask=async(...args)=>{h.writes.push(args);return new Promise(resolve=>finish=resolve)}
  await h.open({id:'a',kind:'REVIEW',points:30,status:'PENDING',hasImage:false})
  const first=h.review(true);await new Promise(resolve=>setImmediate(resolve));await h.review(true)
  assert.equal(h.writes.length,1);finish({code:0,data:{id:'a',status:'APPROVED'}});await first;assert.equal(h.busy.value,false)
})
test('late evidence cannot replace a different selected application',async()=>{
  const h=setup();let finish;h.api.getManualTaskEvidence=()=>new Promise(resolve=>finish=resolve)
  const first=h.open({id:'a',hasImage:true});await h.open({id:'b',hasImage:false})
  finish({code:0,data:{imageBase64:'private-a'}});await first;assert.equal(h.image.value,'');assert.equal(h.selected.value.id,'b')
})
test('uncertain review refreshes queue without reporting success',async()=>{
  const h=setup();h.api.reviewManualTask=async()=>{throw new Error('network')}
  await h.open({id:'a',kind:'REVIEW',points:30,status:'PENDING',hasImage:false});await h.review(true)
  assert.match(h.error.value,/未能确认/);assert.equal(h.dialog.value,false);assert.equal(h.busy.value,false)
})
