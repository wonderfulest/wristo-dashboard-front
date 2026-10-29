<template>
  <div class="rules-page" v-loading="loading">
    <header>
      <div><h2>表盘生成规则</h2><p>所有用户共用一份已发布规则，适用于 Studio AI 和本地 WRT 生成。</p></div>
      <el-button :disabled="busy" @click="reload">刷新</el-button>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <template v-if="state && form">
      <div class="publication">
        <div><el-tag type="success">当前生效 {{ state.published.version }}</el-tag><span>发布后新任务立即使用；正在生成的任务保留原规则。</span></div>
        <el-tag v-if="state.draftSource" type="warning">有未发布草稿</el-tag>
        <el-tag v-if="dirty" type="info">有未保存修改</el-tag>
      </div>
      <el-tabs v-model="tab">
        <el-tab-pane label="编辑规则" name="edit">
          <el-form label-position="top" :disabled="busy">
            <section>
              <h3>默认字号与选项</h3><p>画布基准固定为 454 × 454。字号可按用户明确要求覆盖。</p>
              <div class="defaults">
                <el-form-item v-for="item in defaults" :key="item.key" :label="item.label">
                  <el-select v-if="['dataSize', 'dateMinSize'].includes(item.key)" v-model="form.defaults[item.key]" style="width: 150px">
                    <el-option v-for="size in [18,22,26,30,36,42,48,56,64,72,80,96,112]" :key="size" :label="String(size)" :value="size" />
                  </el-select>
                  <el-input-number v-else v-model="form.defaults[item.key]" :min="1" :max="item.max" :precision="0" />
                </el-form-item>
              </div>
            </section>
            <section v-for="item in sections" :key="item.key">
              <el-form-item :label="item.label">
                <el-input v-model="form[item.key]" type="textarea" :autosize="{ minRows: item.rows, maxRows: 22 }" />
              </el-form-item>
            </section>
            <section class="publish-actions">
              <el-form-item label="本次修改说明（保存、发布、回滚都会记录）">
                <el-input v-model="note" maxlength="500" show-word-limit placeholder="说明本次调整的内容和原因" />
              </el-form-item>
              <div>
                <el-button :disabled="busy || !dirty || !note.trim()" @click="save">保存草稿</el-button>
                <el-button type="primary" :disabled="busy || dirty || !state.draftSource || !note.trim()" @click="publish">发布草稿</el-button>
                <span>保存草稿不会改变线上规则；未保存修改须先保存。</span>
              </div>
            </section>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="当前生效内容" name="published"><pre>{{ pretty(state.published.source) }}</pre></el-tab-pane>
        <el-tab-pane label="修改与发布历史" name="history">
          <p>每次保存、发布和回滚均留档。回滚会发布一个新版本，保留现有草稿。</p>
          <el-table :data="history" v-loading="historyLoading">
            <el-table-column prop="revision" label="记录" width="75" />
            <el-table-column label="操作" width="100"><template #default="{ row }">{{ actionLabel(row.action) }}</template></el-table-column>
            <el-table-column prop="note" label="说明" min-width="200" />
            <el-table-column prop="actor" label="操作人" width="120" />
            <el-table-column label="时间" width="180"><template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template></el-table-column>
            <el-table-column label="操作" width="170"><template #default="{ row }">
              <el-button link @click="selected = row">查看内容</el-button>
              <el-button v-if="row.action !== 'DRAFT'" link type="warning" :disabled="busy || dirty" @click="rollback(row)">回滚到此版</el-button>
            </template></el-table-column>
          </el-table>
          <div class="pager"><el-button :disabled="page === 1 || historyLoading" @click="changePage(-1)">上一页</el-button><span>第 {{ page }} 页</span><el-button :disabled="history.length < 20 || historyLoading" @click="changePage(1)">下一页</el-button></div>
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-dialog :model-value="!!selected" title="历史规则内容与当前生效内容" width="90%" @close="selected = undefined">
      <div v-if="selected && state" class="comparison"><div><h3>记录 {{ selected.revision }}</h3><pre>{{ pretty(selected.source) }}</pre></div><div><h3>当前生效 {{ state.published.version }}</h3><pre>{{ pretty(state.published.source) }}</pre></div></div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRules, getRuleHistory, saveRuleDraft, publishRules, rollbackRules, type RuleState, type RuleHistory, type RuleContent } from '@/api/watchfaceRules'
const state = ref<RuleState>(), form = ref<RuleContent>(), selected = ref<RuleHistory>()
const loading = ref(false), busy = ref(false), historyLoading = ref(false), error = ref(''), note = ref(''), tab = ref('edit')
const history = ref<RuleHistory[]>([]), page = ref(1), baseline = ref('')
const dirty = computed(() => !!form.value && JSON.stringify(form.value) !== baseline.value)
const defaults = [{ key: 'iconSize', label: '图标字号', max: 112 }, { key: 'dataSize', label: '数据字号', max: 112 }, { key: 'dateMinSize', label: '日期最小字号', max: 112 }, { key: 'minDataOptions', label: '每个数据位最少选项', max: 112 }, { key: 'colorOptions', label: '每个颜色属性选项', max: 10 }]
const sections: { key: 'policy' | 'naming' | 'geometry' | 'requirementsMarkdown' | 'capabilityPolicy'; label: string; rows: number }[] = [
  { key: 'policy', label: '适用范围与覆盖原则', rows: 3 }, { key: 'naming', label: '属性命名', rows: 3 },
  { key: 'geometry', label: '布局与可读性', rows: 3 }, { key: 'requirementsMarkdown', label: '详细生成与验证要求（Markdown；{{minDataOptions}}、{{colorOptions}} 引用上方设置）', rows: 15 },
  { key: 'capabilityPolicy', label: '验证结果与能力边界', rows: 3 }
]
const pretty = (source: string) => JSON.stringify(JSON.parse(source), null, 2)
const actionLabel = (action: string) => ({ INITIAL: '初始化', DRAFT: '保存草稿', PUBLISH: '发布', ROLLBACK: '回滚发布' }[action] || action)
function apply(value: RuleState) {
  state.value = value; form.value = JSON.parse(value.draftSource || value.published.source)
  baseline.value = JSON.stringify(form.value)
}
async function loadHistory() {
  historyLoading.value = true
  try { const data = (await getRuleHistory(page.value)).data; if (!data) throw new Error(); history.value = data }
  catch { error.value = '读取历史失败，请刷新重试。' }
  finally { historyLoading.value = false }
}
async function load() {
  loading.value = true; error.value = ''
  try { const data = (await getRules()).data; if (!data) throw new Error(); apply(data); await loadHistory() }
  catch { error.value = '读取规则失败，未使用本地默认值替代。请刷新重试。' }
  finally { loading.value = false }
}
async function discardConfirmed() {
  if (!dirty.value) return true
  try { await ElMessageBox.confirm('有未保存修改，确定离开当前编辑内容？', '未保存修改', { type: 'warning' }); return true } catch { return false }
}
async function reload() { if (await discardConfirmed()) await load() }
async function changePage(delta: number) { page.value += delta; await loadHistory() }
async function mutate(operation: () => Promise<{ data?: RuleState }>, message: string) {
  busy.value = true; error.value = ''
  try { const data = (await operation()).data; if (!data) throw new Error(); apply(data); ElMessage.success(message); page.value = 1; await loadHistory() }
  catch (e: any) { error.value = e?.msg || e?.response?.data?.msg || '操作未完成。请保留当前内容并刷新核对；多人编辑冲突时不能直接覆盖。' }
  finally { busy.value = false }
}
async function save() {
  if (!state.value || !form.value || busy.value) return
  await mutate(() => saveRuleDraft(state.value!.revision, JSON.stringify(form.value), note.value.trim()), '草稿已保存，线上规则未改变')
}
async function publish() {
  if (!state.value || dirty.value || busy.value) return
  try { await ElMessageBox.confirm('发布此草稿后，所有用户的新生成任务将使用它。确认发布？', '发布系统规则', { type: 'warning' }) } catch { return }
  await mutate(() => publishRules(state.value!.revision, note.value.trim()), '已发布，所有新任务使用当前规则')
}
async function rollback(row: RuleHistory) {
  if (!state.value || dirty.value || busy.value) return
  let reason: string
  try { reason = (await ElMessageBox.prompt(`将记录 ${row.revision} 的内容作为新版本发布。现有草稿保留。`, '回滚系统规则', { inputPlaceholder: '填写回滚原因', inputValidator: value => !!value?.trim() && value.length <= 500 || '请填写 1–500 字的回滚原因' })).value } catch { return }
  await mutate(() => rollbackRules(state.value!.revision, row.revision, reason.trim()), '回滚已发布，历史记录已保留')
}
onBeforeRouteLeave(discardConfirmed)
onMounted(load)
</script>
<style scoped>
.rules-page { padding: 24px; max-width: 1440px; margin: 0 auto; }
header, .publication, .pager { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
header { margin-bottom: 20px; } h2 { margin: 0 0 8px; } p, .publication span, .publish-actions span { color: var(--el-text-color-secondary); font-size: 13px; }
.publication { justify-content: flex-start; flex-wrap: wrap; padding: 20px 0; }.publication div { display: flex; gap: 12px; align-items: center; }
section { border: 1px solid var(--el-border-color-light); border-radius: 8px; padding: 20px; margin-bottom: 16px; }h3 { margin: 0 0 12px; font-size: 15px; }.defaults { display: flex; flex-wrap: wrap; gap: 24px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--el-fill-color-light); padding: 20px; line-height: 1.7; max-height: 65vh; overflow: auto; font-size: 13px; }
.comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; min-width: 0; }.comparison > div { min-width: 0; }.pager { justify-content: flex-end; margin-top: 16px; }
@media (max-width: 800px) { .rules-page { padding: 12px; }.comparison { grid-template-columns: 1fr; }.publication div { align-items: flex-start; flex-direction: column; } }
</style>
