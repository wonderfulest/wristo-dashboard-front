<template>
  <el-dialog v-model="visible" title="按业务场景测试邮件" width="min(1000px, 95vw)">
    <el-alert title="使用示例数据，仅发送邮件；不会创建订单、修改订阅或生成有效验证码。营销邮件请使用对应模板的测试发送。" type="info" :closable="false" />
    <el-form label-width="90px" class="test-form" @submit.prevent>
      <el-form-item label="测试邮箱">
        <el-input v-model="email" placeholder="输入接收测试邮件的邮箱" :disabled="busy" />
      </el-form-item>
      <el-form-item label="邮件场景">
        <el-select v-model="scenarioId" style="width: 100%" :disabled="busy || loading">
          <el-option v-for="item in scenarios" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <div class="hint">{{ selected?.description }}</div>
      </el-form-item>
      <el-button :loading="previewing" :disabled="busy" @click="preview">预览邮件</el-button>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-alert v-if="result" :title="result.message" :type="result.status === 'MAIL_DISABLED' ? 'warning' : 'success'" :closable="false" />
    <template v-if="rendered">
      <el-alert v-if="rendered.warning" :title="rendered.warning" type="warning" :closable="false" />
      <el-descriptions :column="1" border class="metadata">
        <el-descriptions-item label="主题">{{ rendered.subject }}</el-descriptions-item>
        <el-descriptions-item label="发件人">{{ rendered.fromEmail }}</el-descriptions-item>
      </el-descriptions>
      <iframe title="测试邮件正文预览" sandbox="" :srcdoc="rendered.html" class="mail-preview" />
    </template>
    <template #footer>
      <el-button @click="visible = false" :disabled="busy">关闭</el-button>
      <el-button type="primary" :loading="sending" :disabled="busy || !rendered?.canSend" @click="send">
        发送到测试邮箱
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

interface Scenario { id: string; name: string; description: string }
interface Preview { subject: string; fromEmail: string; html: string; warning: string; canSend: boolean }
interface SendResult { status: string; message: string }
const visible = defineModel<boolean>({ default: false })
const scenarios = ref<Scenario[]>([])
const scenarioId = ref('')
const email = ref('')
const loading = ref(false)
const previewing = ref(false)
const sending = ref(false)
const busy = computed(() => previewing.value || sending.value)
const selected = computed(() => scenarios.value.find(item => item.id === scenarioId.value))
const rendered = ref<Preview | null>(null)
const result = ref<SendResult | null>(null)
const error = ref('')
watch([email, scenarioId], () => { rendered.value = null; result.value = null; error.value = '' })
watch(visible, async value => {
  if (!value || scenarios.value.length) return
  loading.value = true
  try {
    const res: ApiResponse<Scenario[]> = await instance.get('/admin/contact/email-test/scenarios')
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '加载场景失败')
    scenarios.value = res.data
    scenarioId.value = res.data[0]?.id || ''
  } catch (e) { error.value = message(e) } finally { loading.value = false }
})
function message(e: unknown) {
  const failure = e as { msg?: string; message?: string; response?: { data?: { msg?: string } } }
  return failure?.response?.data?.msg || failure?.msg || failure?.message || '请求失败，请重试'
}
function request() {
  const toEmail = email.value.trim()
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(toEmail)) throw new Error('请输入有效的单个邮箱地址')
  if (!scenarioId.value) throw new Error('请选择邮件场景')
  return { scenarioId: scenarioId.value, toEmail }
}
async function preview() {
  if (busy.value) return
  error.value = ''; result.value = null; rendered.value = null
  previewing.value = true
  try {
    const res: ApiResponse<Preview> = await instance.post('/admin/contact/email-test/preview', request())
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '预览失败')
    rendered.value = res.data
  } catch (e) { error.value = message(e) } finally { previewing.value = false }
}
async function send() {
  if (busy.value || !rendered.value?.canSend) return
  error.value = ''; result.value = null; sending.value = true
  try {
    const res: ApiResponse<SendResult> = await instance.post('/admin/contact/email-test/send', request())
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '发送失败')
    result.value = res.data
  } catch (e) { error.value = message(e) } finally { sending.value = false }
}
</script>

<style scoped>
.test-form { margin: 20px 0; }
.hint { color: #606266; font-size: 13px; margin-top: 6px; }
.metadata { margin: 16px 0; }
.mail-preview { width: 100%; height: 520px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; }
</style>
