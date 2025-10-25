<template>
  <div class="s3-ops-page">
    <div class="header">
      <h2>AWS S3 运维</h2>
      <div class="ops">
        <el-popconfirm
          width="260"
          confirm-button-text="确定"
          cancel-button-text="取消"
          icon-color="var(--el-color-warning)"
          title="确认清理历史 release 压缩包吗？此操作不可撤销。"
          @confirm="onClean"
        >
          <template #reference>
            <el-button type="danger" :loading="cleaning">清理历史 release 压缩包</el-button>
          </template>
        </el-popconfirm>
        <el-button @click="refreshStatus" :loading="checking">刷新状态</el-button>
      </div>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>最近一次操作</span>
        </div>
      </template>
      <div class="status">
        <div class="row">
          <span class="k">状态</span>
          <el-tag :type="status.type">{{ status.text }}</el-tag>
        </div>
        <div class="row">
          <span class="k">时间</span>
          <span class="mono">{{ lastTime || '-' }}</span>
        </div>
        <div class="row">
          <span class="k">消息</span>
          <span class="mono">{{ lastMsg || '-' }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { cleanRelease } from '@/api/ops-s3'

const cleaning = ref(false)
const checking = ref(false)
const lastTime = ref<string>('')
const lastMsg = ref<string>('')
const status = ref<{ type: 'info' | 'success' | 'danger'; text: string }>({ type: 'info', text: '未知' })

const onClean = async () => {
  cleaning.value = true
  try {
    const res = await cleanRelease()
    if (res.data === true) {
      status.value = { type: 'success', text: '已清理' }
      lastTime.value = new Date().toISOString().replace('T', ' ').slice(0, 19)
      lastMsg.value = '历史 release 压缩包已清理'
      ElMessage.success('清理成功')
    } else {
      status.value = { type: 'info', text: '无变更或未清理' }
      lastTime.value = new Date().toISOString().replace('T', ' ').slice(0, 19)
      lastMsg.value = '接口返回 false'
      ElMessage.info('无可清理或已是最新')
    }
  } catch (e: any) {
    status.value = { type: 'danger', text: '失败' }
    lastTime.value = new Date().toISOString().replace('T', ' ').slice(0, 19)
    lastMsg.value = e?.msg || e?.message || '请求失败'
  } finally {
    cleaning.value = false
  }
}

const refreshStatus = async () => {
  checking.value = true
  try {
    // 如果后端未来提供状态查询，可在此调用。当前仅清空后提示。
    ElMessage.success('已刷新')
  } finally {
    checking.value = false
  }
}
</script>

<style scoped>
.s3-ops-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ops { display: flex; gap: 12px; align-items: center; }
.status { display: grid; grid-template-columns: 1fr; gap: 8px; }
.row { display: flex; align-items: center; gap: 8px; }
.k { width: 80px; color: var(--el-text-color-secondary); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
