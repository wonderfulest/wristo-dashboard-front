import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/views/ops/MiniappPoints.vue',import.meta.url),'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'')
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const task=(key,extra={})=>({key,enabled:true,name:key,description:'说明',points:2,maxClaims:3,period:'DAY',fixed:false,claimCap:0,...extra})
function setup() {
 const writes=[]
 const api={getPointsRewards:async()=>({code:0,data:{makeupEnabled:true}}),getPointsTasks:async()=>({code:0,data:[task('ad'),task('weeklyInstall',{period:'WEEK',maxClaims:1,claimCap:1})]}),savePointsTask:async value=>{writes.push(value);return {code:0,data:value}},savePointsMakeup:async enabled=>{writes.push({enabled});return {code:0,data:{enabled}}}}
 const ctx={ref:value=>({value}),computed:fn=>({get value(){return fn()}}),onMounted(){},defineProps:()=>({mode:'rewards'}),ElMessage:{warning(){},success(){}},...Object.fromEntries(Object.keys(api).map(key=>[key,(...args)=>api[key](...args)]))}
 return {...new Function(...Object.keys(ctx),`${code}; return { tasks, rewards, rewardsError, rewardsUncertain, weeklyRewardSummary, loadRewards, saveTask, toggleTask, saveRewards };`)(...Object.values(ctx)),api,writes}
}
test('weekly estimate uses enabled tasks and configured limits including unlimited',async()=>{
 const h=setup();await h.loadRewards();assert.deepEqual(h.weeklyRewardSummary.value,{dailyTotal:6,daily:42,weekly:2,total:44})
 h.tasks.value[0].enabled=false;assert.equal(h.weeklyRewardSummary.value.total,2)
 h.tasks.value[0].enabled=true;h.tasks.value[0].maxClaims=0;assert.equal(h.weeklyRewardSummary.value,null)
})
test('switch only saves authoritative fields and unknown save outcome blocks writes until refresh',async()=>{
 const h=setup();await h.loadRewards();const item=h.tasks.value[0];item.points=88
 await h.toggleTask(item,false);assert.equal(h.writes[0].points,2);assert.equal(item.points,88);assert.equal(item.enabled,false)
 h.api.savePointsTask=async()=>{throw Error('offline')};await h.toggleTask(item,true)
 assert.equal(h.rewardsUncertain.value,true);assert.match(h.rewardsError.value,/刷新/)
 await h.saveTask(item);assert.equal(h.writes.length,1)
 await h.loadRewards();assert.equal(h.rewardsUncertain.value,false)
})
test('valid task settings save but immutable login and invalid limits do not write',async()=>{
 const h=setup();await h.loadRewards()
 for (const input of [task('login',{fixed:true}),task('ad',{points:0}),task('ad',{maxClaims:-1}),task('ad',{maxClaims:1.5}),task('checkIn',{claimCap:1,maxClaims:2}),task('ad',{name:''})]) await h.saveTask(input)
 assert.equal(h.writes.length,0)
 await h.saveTask(task('ad',{name:'  视频  ',description:'  完整观看  ',maxClaims:0}));assert.equal(h.writes[0].name,'视频');assert.equal(h.writes[0].maxClaims,0)
})
test('makeup save changes only its switch and cannot overwrite task amounts',async()=>{
 const h=setup();await h.loadRewards();h.rewards.value.makeupEnabled=false
 await h.saveRewards();assert.deepEqual(h.writes,[{enabled:false}])
})
