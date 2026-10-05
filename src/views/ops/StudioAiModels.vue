<template>
  <div class="ai-page" v-loading="loading">
    <div class="header">
      <div><h2>AI 模型配置</h2><p>管理 Studio AI 表盘设计、Banner、应用标签和描述的开关、模型及积分。</p></div>
      <div class="actions">
        <el-button @click="$router.push('/ops/ai-prices')">模型官方定价</el-button>
        <el-button :disabled="loading || saving" @click="load">刷新</el-button>
        <el-button :disabled="loading || saving" @click="openHistory">修改历史</el-button>
        <el-button type="primary" :loading="saving" :disabled="loading || !settings" @click="save">保存配置</el-button>
      </div>
    </div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert v-if="!active && settings" title="此配置当前未激活，所有 AI 场景均不可用。保存配置将重新激活。" type="warning" :closable="false" />
    <div class="credentials" v-if="settings">
      <el-tag v-for="item in credentialLabels" :key="item.key" :type="credentials[item.key] ? 'success' : 'info'">
        {{ item.label }}：{{ credentials[item.key] ? '密钥已配置' : '未配置密钥' }}
      </el-tag>
      <span>密钥由服务端环境变量管理；已配置不代表已验证模型访问权限。</span>
    </div>
    <template v-if="settings">
      <el-card shadow="never">
        <template #header><strong>AI 生成总开关</strong></template>
        <el-switch v-model="settings.enabled" :disabled="saving" active-text="开启" inactive-text="关闭" />
        <p class="hint">关闭后，所有用户的 Studio AI 生成入口将隐藏，新的生成请求将被拒绝。开启后还需同时满足用户开关、场景及模型配置。保存后生效，Studio 刷新或重新进入后更新入口。</p>
      </el-card>
      <el-card v-for="group in sceneGroups" :key="group.title" shadow="never">
        <template #header><strong>{{ group.title }}</strong></template>
        <p class="hint">{{ group.description }}</p>
        <el-table :data="group.scenes">
          <el-table-column label="场景" min-width="150"><template #default="{ row }">{{ row.label }}</template></el-table-column>
          <el-table-column label="启用" width="100"><template #default="{ row }"><el-switch v-model="settings.scenes[row.key as AiScene].enabled" :disabled="saving" /></template></el-table-column>
          <el-table-column label="默认模型" min-width="320">
            <template #default="{ row }">
              <el-select v-model="settings.scenes[row.key as AiScene].modelId" :disabled="saving" style="width: 100%">
                <el-option v-for="model in sceneModels(row.key)" :key="model.id" :value="model.id"
                  :label="`${providerLabel(model.provider)} · ${model.model}${model.enabled ? '' : '（已禁用）'}`" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="每次消耗积分" min-width="180"><template #default="{ row }"><el-input-number v-model="settings.scenes[row.key as AiScene].creditCost" :min="1" :max="100000" :precision="0" :step="1" :disabled="saving" /></template></el-table-column>
          <el-table-column label="当前草稿状态" min-width="160"><template #default="{ row }"><el-tag :type="sceneReady(row.key) ? 'success' : 'warning'">{{ sceneStatus(row.key) }}</el-tag></template></el-table-column>
        </el-table>
        <p class="hint">保存后，新请求使用最新配置；已启动的任务继续使用原模型和提交时确认的积分价格。禁用模型会暂停使用该模型的场景，失败不会自动切换供应商。</p>
      </el-card>
      <el-card shadow="never">
        <template #header><div class="header"><strong>模型目录</strong><el-button :disabled="saving" @click="addModel">新增模型</el-button></div></template>
        <el-table :data="settings.models">
          <el-table-column label="供应商" min-width="150"><template #default="{ row }"><el-select v-model="row.provider" :disabled="saving"><el-option label="阿里云百炼" value="BAILIAN" /><el-option label="OpenAI" value="OPENAI" /></el-select></template></el-table-column>
          <el-table-column label="模型名称" min-width="230"><template #default="{ row }"><el-input v-model="row.model" maxlength="100" :disabled="saving" placeholder="供应商 API 模型名称" /></template></el-table-column>
          <el-table-column label="能力" min-width="190"><template #default="{ row }"><el-select v-model="row.capability" :disabled="saving"><el-option label="文本 / 视觉理解" value="TEXT" /><el-option label="参考图生成图片" value="IMAGE" /></el-select></template></el-table-column>
          <el-table-column label="启用" width="95"><template #default="{ row }"><el-switch v-model="row.enabled" :disabled="saving" /></template></el-table-column>
          <el-table-column label="操作" width="100"><template #default="{ row }"><el-button type="danger" link :disabled="saving || isSelected(row.id)" @click="removeModel(row.id)">删除</el-button></template></el-table-column>
        </el-table>
        <p class="hint">AI 表盘设计使用视觉文本模型理解提示词和参考图，生成逐元素布局，再由服务端编译为可编辑 WRT；用于应用标签和描述的文本模型还须支持图像输入。OpenAI 文本使用 Responses API，图片使用 GPT Image 编辑接口；百炼沿用兼容文本接口和多模态图片接口。自定义模型需与对应接口兼容。</p>
      </el-card>
    </template>
    <el-drawer v-model="historyVisible" title="AI 模型配置 · 修改历史" size="min(850px, 96vw)">
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" />
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="updatedBy" label="操作人" width="130" />
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="配置变更" min-width="320"><template #default="{ row }"><details><summary>查看配置</summary><p>旧配置</p><pre>{{ row.oldValue || '默认配置' }}</pre><p>新配置</p><pre>{{ row.newValue }}</pre></details></template></el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStudioAi, saveStudioAi, type AiSettings, type AiScene, type AiModel, type AiAdminView } from '@/api/studioAi'
import { getConfigHistory } from '@/api/config'
import type { GlobalConfigHistory } from '@/types/ops'

const settings = ref<AiSettings>()
const credentials = ref<Record<string, boolean>>({})
const active = ref(true)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const historyVisible = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const histories = ref<GlobalConfigHistory[]>([])
const scenes: { key: AiScene; label: string }[] = [{ key: 'WATCHFACE', label: 'AI 表盘设计（WRT）' }, { key: 'WATCHFACE_ADJUST', label: 'AI 表盘局部调整' }, { key: 'BANNER', label: 'Banner 图片' }, { key: 'TAGS', label: '应用标签' }, { key: 'DESCRIPTION', label: 'AI 描述' }]
const sceneGroups = [
  {
    title: 'AI 表盘设计',
    description: '对应 Studio 新建画布中的 Create with AI。支持提示词与一张参考图共同生成可编辑 WRT，包含数字/指针时间、月相、天气和动态资源组。参考图生成需要支持图像输入的模型。默认每次 20 积分，可在此调整；实际调用模型前扣费，生成失败自动退回原扣款。',
    scenes: scenes.filter(scene => scene.key === 'WATCHFACE'),
  },
  {
    title: 'AI 表盘调整',
    description: '对应编辑器中的 AI Adjust 对话面板。按每轮调整请求计费，默认 5 积分；调用模型前扣费，生成或校验失败自动退款。成功生成后不应用或撤销不退款，预览和应用不重复扣费。',
    scenes: scenes.filter(scene => scene.key === 'WATCHFACE_ADJUST'),
  },
  {
    title: '其他生成场景',
    description: '分别管理 Banner 图片、应用标签和 AI 描述。',
    scenes: scenes.filter(scene => scene.key !== 'WATCHFACE' && scene.key !== 'WATCHFACE_ADJUST'),
  },
]
const credentialLabels = [{ key: 'BAILIAN_TEXT', label: '百炼文本' }, { key: 'BAILIAN_IMAGE', label: '百炼图片' }, { key: 'OPENAI', label: 'OpenAI' }]
const providerLabel = (value: string) => value === 'OPENAI' ? 'OpenAI' : '百炼'
const sceneModels = (scene: AiScene) => settings.value?.models.filter(m => m.capability === (scene === 'BANNER' ? 'IMAGE' : 'TEXT')) || []
const isSelected = (id: string) => Object.values(settings.value?.scenes || {}).some(route => route.modelId === id)
const hasCredentials = (model: AiModel) => credentials.value[model.provider === 'OPENAI' ? 'OPENAI' : `BAILIAN_${model.capability}`]
function sceneStatus(scene: AiScene) {
  if (settings.value?.enabled === false) return '总开关已关闭'
  const route = settings.value?.scenes[scene]
  const model = sceneModels(scene).find(m => m.id === route?.modelId)
  if (!route?.enabled) return '场景已暂停'
  if (!model) return '请选择匹配的模型'
  if (!model.enabled) return '模型已禁用'
  if (!hasCredentials(model)) return '缺少服务端密钥'
  return '可用'
}
const sceneReady = (scene: AiScene) => sceneStatus(scene) === '可用'
function apply(data: AiAdminView) { settings.value = { ...data.settings, enabled: data.settings.enabled !== false }; credentials.value = data.credentials; active.value = data.active }
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try { const response = await getStudioAi(); if (response.code !== 0 || !response.data) throw new Error(); apply(response.data) }
  catch { error.value = '无法读取 AI 配置，请刷新后重试。' }
  finally { loading.value = false }
}
function addModel() {
  settings.value?.models.push({ id: `model-${crypto.randomUUID()}`, provider: 'OPENAI', model: '', capability: 'TEXT', enabled: false })
}
function removeModel(id: string) { if (settings.value && !isSelected(id)) settings.value.models = settings.value.models.filter(m => m.id !== id) }
async function save() {
  if (!settings.value || saving.value) return
  if (settings.value.models.some(m => !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(m.model))) { ElMessage.warning('请填写有效的模型名称'); return }
  if (scenes.some(s => !sceneModels(s.key).some(m => m.id === settings.value!.scenes[s.key].modelId))) { ElMessage.warning('请为每个场景选择能力匹配的模型'); return }
  if (scenes.some(s => !Number.isInteger(settings.value!.scenes[s.key].creditCost) || settings.value!.scenes[s.key].creditCost < 1 || settings.value!.scenes[s.key].creditCost > 100000)) { ElMessage.warning('积分须为 1 至 100000 的整数'); return }
  saving.value = true; error.value = ''
  try {
    const response = await saveStudioAi(settings.value)
    if (response.code !== 0 || !response.data) throw new Error()
    apply(response.data); ElMessage.success('AI 配置已保存，新请求立即生效')
  } catch { error.value = '未能确认保存结果，请刷新核对最新配置后重试。' }
  finally { saving.value = false }
}
async function openHistory() {
  historyVisible.value = true; historyLoading.value = true; historyError.value = ''; histories.value = []
  try { const response = await getConfigHistory('studio.ai.models', 'thirdparty'); if (response.code !== 0 || !response.data) throw new Error(); histories.value = response.data }
  catch { historyError.value = '无法加载修改历史。' }
  finally { historyLoading.value = false }
}
onMounted(load)
</script>

<style scoped>
.ai-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.header, .actions, .credentials { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
h2 { margin: 0 0 8px; }
p, .hint, .credentials > span:last-child { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.credentials { justify-content: flex-start; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
</style>
