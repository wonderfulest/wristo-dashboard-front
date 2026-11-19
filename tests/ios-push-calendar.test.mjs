import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { ref, computed, reactive } from 'vue'
const source=fs.readFileSync(new URL('../src/components/ops/IOSWatchfacePushCalendar.vue',import.meta.url),'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'')
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
function setup(){
 const writes=[],errors=[]
 const messages=Object.fromEntries(['en','zh-Hans','de','es','fr','it','nl','pl','pt-BR'].map(l=>[l,{title:'Hello',body:'New {productName}'}]))
 const props={settings:{enabled:true,sendTime:'19:35',title:'Hello',body:'New {productName}',appId:null,templateId:'daily',messages},templates:[],revision:0}
 const api={getIOSPushCalendar:async()=>({code:0,data:[]}),saveIOSPushPlan:async(...args)=>{writes.push(args);return {code:0}},cancelIOSPushPlan:async day=>{writes.push(day);return {code:0}}}
 const context={ref,computed,reactive,watch(){},defineProps:()=>props,defineEmits:()=>()=>{},ElMessage:{error:e=>errors.push(e),warning:e=>errors.push(e),success(){}},ElMessageBox:{confirm:async()=>true},...Object.fromEntries(Object.keys(api).map(k=>[k,(...args)=>api[k](...args)]))}
 return {...new Function(...Object.keys(context),code+';return {selected,tasks,loading,error,load,edit,save,remove,appId,draft,messages,editable,cutoff};')(...Object.values(context)),api,props,writes,errors}
}
test('month switch ignores older responses and maintains loading state',async()=>{
 const h=setup();let a,b;h.api.getIOSPushCalendar=()=>new Promise(r=>a=r);const first=h.load();h.api.getIOSPushCalendar=()=>new Promise(r=>b=r);const second=h.load();a({code:0,data:[{pushDay:'old'}]});await first;assert.equal(h.loading.value,true);b({code:0,data:[{pushDay:'new'}]});await second;assert.equal(h.tasks.value[0].pushDay,'new')
})
test('date editor snapshots all language messages without modifying saved defaults',async()=>{
 const h=setup();h.selected.value=new Date('2099-06-12T12:00:00');h.edit();h.appId.value=42;h.messages.en.title='Changed';h.selected.value=new Date('2099-06-13T12:00:00');await h.save();assert.equal(h.writes[0][0],'2099-06-12');assert.equal(h.writes[0][1].appId,42);assert.equal(Object.keys(h.writes[0][1].messages).length,9);assert.equal(h.props.settings.messages.en.title,'Hello')
})
test('global cutoff uses UTC+14 and existing snapshots cannot be edited',()=>{
 const h=setup();assert.equal(h.cutoff('2026-12-01','19:35'),Date.parse('2026-12-01T05:35:00Z'));assert.equal(h.editable({pushDay:'2099-06-12',status:'READY',config:{sendTime:'19:35'}}),false)
})
test('missing language and failed requests preserve editor data',async()=>{
 const h=setup();h.selected.value=new Date('2099-06-12T12:00:00');h.edit();h.appId.value=42;h.messages.de.body='';await h.save();assert.equal(h.writes.length,0);assert.ok(h.errors.length);h.api.getIOSPushCalendar=async()=>{throw Error('offline')};h.tasks.value=[{pushDay:'old'}];await h.load();assert.deepEqual(h.tasks.value,[]);assert.equal(h.error.value,'offline')
})
test('removing a pending plan uses its own date',async()=>{
 const h=setup();h.selected.value=new Date('2099-06-12T12:00:00');h.tasks.value=[{pushDay:'2099-06-12',status:'PLANNED',config:{sendTime:'19:35'}}];await h.remove();assert.deepEqual(h.writes,['2099-06-12'])
})
