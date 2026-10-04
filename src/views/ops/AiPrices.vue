<template>
  <div class="prices-page">
    <header><div><h2>AI 模型定价</h2><p>录入官方最高单价，为新调用生成保守的成本预估。</p></div><div><el-button @click="$router.push('/ops/ai-usage')">用量与成本</el-button><el-button @click="$router.push('/ops/ai-models')">模型配置</el-button><el-button type="primary" @click="openCreate()">新增价格版本</el-button></div></header>
    <el-alert title="每个模型选择按 Token 或按张计费。输入、输出均按录入的最高价计算，不区分缓存、阶梯或图片规格。新版本不改写历史调用成本。" type="info" :closable="false" show-icon />
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-card shadow="never">
      <div class="filters"><el-input v-model="keyword" placeholder="筛选模型名称" clearable style="max-width:280px" /><el-button :loading="loading" @click="load">刷新</el-button><el-button v-if="selectedVersion" @click="$router.replace('/ops/ai-prices')">查看全部版本</el-button></div>
      <el-table :data="filtered" v-loading="loading" empty-text="尚未配置价格，请依据官方来源录入最高单价。" row-key="id">
        <el-table-column label="模型" min-width="220"><template #default="{row}"><strong>{{ row.model }}</strong><div class="muted">{{ row.provider }}</div></template></el-table-column>
        <el-table-column label="计费方式" width="110"><template #default="{row}">{{ row.rules.mode === 'TOKENS' ? '按 Token' : '按张' }}</template></el-table-column>
        <el-table-column prop="currency" label="币种" width="80" />
        <el-table-column label="输入最高价 / 百万 Token" min-width="175"><template #default="{row}">{{ rate(row.rules.input) }}</template></el-table-column>
        <el-table-column label="输出最高价 / 百万 Token" min-width="175"><template #default="{row}">{{ rate(row.rules.output) }}</template></el-table-column>
        <el-table-column label="每张最高价" min-width="120"><template #default="{row}">{{ rate(row.rules.image) }}</template></el-table-column>
        <el-table-column label="生效时间（北京时间）" min-width="195"><template #default="{row}">{{ time(row.effectiveAt) }}<div><el-tag :type="versionStatus(row)==='当前生效' ? 'success' : 'info'">{{ versionStatus(row) }}</el-tag></div></template></el-table-column>
        <el-table-column label="版本 / 操作人" min-width="160"><template #default="{row}"><el-tooltip :content="row.id"><span>{{ row.id.slice(0,8) }}</span></el-tooltip><div class="muted">{{ row.createdBy }}</div></template></el-table-column>
        <el-table-column label="操作" width="170" fixed="right"><template #default="{row}"><a :href="row.sourceUrl" target="_blank" rel="noopener noreferrer">官方来源</a><el-button link type="primary" @click="openCreate(row)">新建版本</el-button></template></el-table-column>
      </el-table>
      <p class="muted">显示最近 1000 个版本。历史版本只读；定价仅用于成本估算，不改变用户积分扣费。</p>
    </el-card>
    <el-dialog v-model="visible" title="新增最高单价版本" width="min(650px, 96vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <el-form label-position="top" @submit.prevent="save">
        <div class="form-grid">
          <el-form-item label="服务商"><el-select v-model="draft.provider" :disabled="saving" @change="changeProvider"><el-option label="OpenAI" value="OPENAI" /><el-option label="阿里云百炼" value="BAILIAN" /></el-select></el-form-item>
          <el-form-item label="模型名称"><el-select v-model="draft.model" filterable allow-create default-first-option :disabled="saving" placeholder="选择或填写 API 模型名称"><el-option v-for="model in availableModels" :key="model" :label="model" :value="model" /></el-select></el-form-item>
          <el-form-item label="计费方式"><el-select v-model="draft.rules.mode" :disabled="saving" @change="changeMode"><el-option label="按 Token" value="TOKENS" /><el-option label="按张" value="IMAGE" /></el-select></el-form-item>
          <el-form-item label="币种"><el-select v-model="draft.currency" :disabled="saving"><el-option label="USD · 美元" value="USD" /><el-option label="CNY · 人民币" value="CNY" /></el-select></el-form-item>
          <template v-if="draft.rules.mode === 'TOKENS'">
            <el-form-item label="输入最高价 / 百万 Token"><el-input-number v-model="draft.rules.input" :min="0" :max="1000000" :precision="10" :controls="false" :disabled="saving" placeholder="请填写最高输入单价" /></el-form-item>
            <el-form-item label="输出最高价 / 百万 Token"><el-input-number v-model="draft.rules.output" :min="0" :max="1000000" :precision="10" :controls="false" :disabled="saving" placeholder="请填写最高输出单价" /></el-form-item>
          </template>
          <el-form-item v-else label="每张图片最高价"><el-input-number v-model="draft.rules.image" :min="0" :max="1000000" :precision="10" :controls="false" :disabled="saving" placeholder="请填写最高图片单价" /></el-form-item>
        </div>
        <el-form-item label="官方定价来源"><el-input v-model="draft.sourceUrl" maxlength="500" :disabled="saving" /><small class="muted">只接受所选服务商的官方 HTTPS 链接，价格请人工核实后填写。</small></el-form-item>
        <el-form-item label="生效时间"><el-date-picker v-model="draft.effectiveAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" :disabled="saving" placeholder="留空即保存后生效" /><small class="muted">时间选择器使用浏览器时区；列表统一显示北京时间。历史调用保持原价格。</small></el-form-item>
        <el-alert :title="draft.rules.mode === 'TOKENS' ? '成本 = 输入 Token × 输入最高价 ÷ 1,000,000 + 输出 Token × 输出最高价 ÷ 1,000,000。缓存输入也按输入最高价计入。' : '成本 = 实际生成图片数 × 每张最高价；不再叠加 Token 费用。'" type="info" :closable="false" />
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" class="save-error" />
        <div class="dialog-actions"><el-button :disabled="saving" @click="visible=false">取消</el-button><el-button type="primary" native-type="submit" :loading="saving">保存新版本</el-button></div>
      </el-form>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAiPrices, getAiPrice, createAiPrice, type PriceDraft, type PriceVersion } from '@/api/aiUsage'
import { getStudioAi, type AiModel } from '@/api/studioAi'
const route = useRoute()
const versions = ref<PriceVersion[]>([]), models = ref<AiModel[]>([])
const keyword = ref(''), error = ref(''), saveError = ref(''), loading = ref(false), saving = ref(false), visible = ref(false)
const defaultDraft = (): PriceDraft => ({provider:'OPENAI',model:'',currency:'USD',sourceUrl:'https://developers.openai.com/api/docs/pricing',effectiveAt:null,rules:{mode:'TOKENS',input:null,output:null,image:null}})
const draft = ref<PriceDraft>(defaultDraft())
const selectedVersion = computed(() => typeof route.query.version === 'string' ? route.query.version : '')
const filtered = computed(() => versions.value.filter(v => (!selectedVersion.value || v.id === selectedVersion.value) && v.model.toLowerCase().includes(keyword.value.toLowerCase())))
const availableModels = computed(() => [...new Set([...models.value.filter(m => m.provider === draft.value.provider).map(m=>m.model), ...versions.value.filter(v=>v.provider===draft.value.provider).map(v=>v.model)])])
const time = (s: string) => new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})
const rate = (v: number | null) => v == null ? '—' : Number(v).toLocaleString('zh-CN',{maximumFractionDigits:10})
function versionStatus(v: PriceVersion) {
  const now = Date.now(), effective = new Date(v.effectiveAt!).getTime()
  if(effective > now) return '待生效'
  return versions.value.some(other => other.provider===v.provider && other.model===v.model && new Date(other.effectiveAt!).getTime()<=now && new Date(other.effectiveAt!).getTime()>effective) ? '历史版本' : '当前生效'
}
async function load() {
  loading.value=true; error.value=''
  try {
    const r=await getAiPrices(); if(r.code!==0 || !r.data) throw new Error(); versions.value=r.data
    if(selectedVersion.value && !versions.value.some(v => v.id === selectedVersion.value)) {
      const detail=await getAiPrice(selectedVersion.value); if(detail.code!==0 || !detail.data) throw new Error(); versions.value.push(detail.data)
    }
  }
  catch { error.value='无法读取价格版本，请刷新重试。'; versions.value=[] }
  finally { loading.value=false }
}
function openCreate(v?: PriceVersion) {
  draft.value=v ? {provider:v.provider,model:v.model,currency:v.currency,sourceUrl:v.sourceUrl,effectiveAt:null,rules:{...v.rules}} : defaultDraft()
  saveError.value=''; visible.value=true
}
function changeProvider() { draft.value.model=''; draft.value.currency=draft.value.provider==='OPENAI'?'USD':'CNY'; draft.value.sourceUrl=draft.value.provider==='OPENAI'?'https://developers.openai.com/api/docs/pricing':'https://help.aliyun.com/zh/model-studio/model-pricing' }
function changeMode() { draft.value.rules.input=null; draft.value.rules.output=null; draft.value.rules.image=null }
async function save() {
  if(saving.value) return
  const d=draft.value, rates=d.rules.mode==='TOKENS'?[d.rules.input,d.rules.output]:[d.rules.image]
  if(!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(d.model) || rates.some(v=>v==null || !Number.isFinite(v) || v<0)) { saveError.value='请填写有效的模型名称和最高单价。'; return }
  saving.value=true; saveError.value=''
  try { const result=await createAiPrice(d); if(result.code!==0 || !result.data) throw new Error(); visible.value=false; ElMessage.success('价格版本已保存，历史调用保持原价格'); await load() }
  catch { saveError.value='未能确认保存结果，请关闭弹窗并刷新核对版本后再重试。' }
  finally { saving.value=false }
}
watch(selectedVersion, load)
onMounted(async () => { await load(); try { const r=await getStudioAi(); if(r.code===0 && r.data) models.value=r.data.settings.models } catch { /* Custom model entry remains available. */ } })
</script>
<style scoped>
.prices-page{padding:24px;display:flex;flex-direction:column;gap:20px}header,.filters,.dialog-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}h2{margin:0 0 8px}.muted,p{font-size:12px;color:var(--el-text-color-secondary);line-height:1.7}.filters{justify-content:flex-start;margin-bottom:16px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.el-select,.el-input-number{width:100%}.dialog-actions{justify-content:flex-end;margin-top:24px}.save-error{margin-top:12px}a{color:var(--el-color-primary);margin-right:12px}@media(max-width:600px){.prices-page{padding:12px}.form-grid{grid-template-columns:1fr}}
</style>
