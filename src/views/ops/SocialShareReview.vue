<template>
  <section>
    <h2>社交分享奖励</h2><p>人工审核通过后发放积分；按北京时间自然月计算通过次数。请核对分享内容、截图和重复提交。</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form v-if="settings" inline :disabled="saving || reviewing || loading">
      <el-form-item label="启用"><el-switch v-model="settings.enabled" /></el-form-item>
      <el-form-item label="每次通过积分"><el-input-number v-model="settings.credits" :min="1" :max="10000" :precision="0" /></el-form-item>
      <el-form-item label="每月通过上限"><el-input-number v-model="settings.monthlyLimit" :min="1" :max="100" :precision="0" /></el-form-item>
      <el-button :loading="saving" @click="save">保存分享配置</el-button>
    </el-form>
    <div class="toolbar"><el-select v-model="status" style="width: 160px" :disabled="loading || reviewing" @change="filter"><el-option label="全部状态" value="" /><el-option label="待审核" value="PENDING" /><el-option label="已通过" value="APPROVED" /><el-option label="已驳回" value="REJECTED" /></el-select><el-button :disabled="loading || reviewing || saving" @click="refresh">刷新</el-button></div>
    <el-table :data="items" v-loading="loading" empty-text="暂无分享记录">
      <el-table-column label="用户 / 平台" width="150"><template #default="{ row }">{{ row.userId }}<br />{{ row.platform }}</template></el-table-column>
      <el-table-column label="分享证据" min-width="260"><template #default="{ row }"><a v-if="safeLink(row.shareUrl)" :href="row.shareUrl" target="_blank" rel="noopener noreferrer">查看公开分享 ↗</a><p>{{ row.notes }}</p><div class="evidence"><el-image v-for="shot in row.screenshots" :key="shot.id" :src="shot.url" :preview-src-list="row.screenshots.map((s: SocialScreenshot) => s.url)" :initial-index="row.screenshots.indexOf(shot)" preview-teleported fit="contain" /></div></template></el-table-column>
      <el-table-column label="状态 / 时间" width="200"><template #default="{ row }">{{ labels[row.status] || row.status }}<span v-if="row.status === 'APPROVED'"> · +{{ row.credits }} 积分</span><p>提交：{{ row.createdAt }}</p><p v-if="row.reviewedAt">审核：{{ row.reviewedAt }}</p><p v-if="row.reviewNote">{{ row.reviewNote }}</p></template></el-table-column>
      <el-table-column label="审核" width="160"><template #default="{ row }"><template v-if="row.status === 'PENDING'"><el-button size="small" type="success" :disabled="reviewing || saving || loading || !settings?.enabled" @click="review(row, true)">通过</el-button><el-button size="small" type="danger" :disabled="reviewing || saving || loading" @click="review(row, false)">驳回</el-button></template></template></el-table-column>
    </el-table>
    <el-pagination :current-page="page" :page-size="20" :total="total" layout="total, prev, pager, next" :disabled="loading || reviewing" @current-change="changePage" />
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { socialRewardsApi, type SocialSettings, type SocialSubmission, type SocialScreenshot } from '@/api/socialRewards'
const settings = ref<SocialSettings>(), items = ref<SocialSubmission[]>([]), total = ref(0), page = ref(1), status = ref('PENDING')
const loading = ref(false), saving = ref(false), reviewing = ref(false), error = ref('')
const labels: Record<string, string> = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' }
function safeLink(value: string) { try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false } }
function message(e: unknown) { const cause = e as { msg?: string; response?: { data?: { msg?: string } } }; return cause?.response?.data?.msg || cause?.msg || '操作失败，请刷新核对结果后重试。' }
let loadRequest = 0
async function load() { const request = ++loadRequest; loading.value = true; error.value = ''; try { const r = await socialRewardsApi.list(page.value, status.value); if (request !== loadRequest) return; if (r.code !== 0 || !r.data) throw r; items.value = r.data.items; total.value = r.data.total } catch (e) { if (request === loadRequest) error.value = message(e) } finally { if (request === loadRequest) loading.value = false } }
async function refresh() { loading.value = true; error.value = ''; try { const r = await socialRewardsApi.settings(); if (r.code !== 0 || !r.data) throw r; settings.value = { ...r.data }; await load() } catch (e) { error.value = message(e) } finally { loading.value = false } }
async function filter() { page.value = 1; await load() }
async function changePage(value: number) { page.value = value; await load() }
async function save() { if (!settings.value || saving.value) return; if ([settings.value.credits, settings.value.monthlyLimit].some(n => !Number.isInteger(n) || n < 1) || settings.value.credits > 10000 || settings.value.monthlyLimit > 100) { error.value = '积分须为 1 至 10000、每月上限须为 1 至 100 的整数'; return }; saving.value = true; error.value = ''; try { const r = await socialRewardsApi.save({ ...settings.value }); if (r.code !== 0 || !r.data) throw r; settings.value = { ...r.data }; ElMessage.success('分享奖励配置已保存') } catch (e) { error.value = message(e) } finally { saving.value = false } }
async function review(item: SocialSubmission, approve: boolean) {
  if (reviewing.value || saving.value || item.status !== 'PENDING') return
  reviewing.value = true; error.value = ''
  try {
    let reason = ''
    try { if (approve) await ElMessageBox.confirm(`确认审核通过并按提交时额度发放 ${item.credits} 积分？请确认内容真实且未重复。`, '确认通过', { type: 'warning', confirmButtonText: '通过并发放积分' }); else { const result = await ElMessageBox.prompt('请输入驳回原因，用户可修改后重新提交。', '驳回分享', { inputType: 'textarea', inputValidator: value => !!value?.trim() && value.trim().length <= 1000 || '请填写 1 至 1000 字的驳回原因' }); reason = result.value.trim() } } catch { return }
    const r = await socialRewardsApi.review(item.id, approve, reason, item.revision); if (r.code !== 0 || !r.data) throw r
    ElMessage.success(approve ? '已审核通过' : '已驳回'); await load()
  } catch (e) { error.value = message(e) } finally { reviewing.value = false }
}
onMounted(refresh)
</script>
<style scoped>
section { border-top: 1px solid var(--el-border-color); padding-top: 24px; }p { font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }.toolbar { display: flex; gap: 12px; margin: 16px 0; }.evidence { display: flex; gap: 8px; flex-wrap: wrap; }.el-image { width: 80px; height: 80px; }.el-pagination { margin-top: 16px; }
</style>
