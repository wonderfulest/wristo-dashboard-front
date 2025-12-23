<template>
  <div class="paddle-sync-page">
    <div class="page-header">
      <h2>Paddle 用户同步</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-button @click="refreshAfter" :loading="afterLoading">刷新游标</el-button>
        <el-button type="primary" @click="handleSync" :loading="syncing">开始同步</el-button>
      </div>
    </div>

    <el-card shadow="never">
      <div class="form-grid">
        <div class="row">
          <div class="label">当前 after（后端游标）</div>
          <div class="value">
            <el-input v-model="after" placeholder="(自动获取)" readonly />
          </div>
        </div>

        <div class="row">
          <div class="label">perPage（单页大小）</div>
          <div class="value">
            <el-input-number v-model="perPage" :min="1" :max="500" :step="10" />
            <span class="hint">可选，建议 50-200</span>
          </div>
        </div>

        <div class="row">
          <div class="label">pages（页数）</div>
          <div class="value">
            <el-input-number v-model="pages" :min="1" :max="200" :step="1" />
            <span class="hint">可选，每次同步请求拉取的页数</span>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="result">
        <div class="result-title">最近一次同步结果</div>
        <div class="result-grid">
          <div><span class="k">created:</span> <span class="v">{{ lastResult?.created ?? '-' }}</span></div>
          <div><span class="k">after:</span> <span class="v">{{ lastResult?.after ?? '-' }}</span></div>
        </div>
      </div>

      <div style="margin-top: 12px; color: #666; font-size: 12px; line-height: 18px;">
        <div>说明：</div>
        <div>1) 每次开始同步前，会先调用「查询当前同步游标」接口获取最新 after。</div>
        <div>2) 同步完成后，页面会展示返回的 created 和新的 after，并自动回填到 after 输入框。</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSyncPaddleCustomersAfter, syncPaddleCustomers } from '@/api/user'
import type { SyncPaddleCustomersResult } from '@/api/user'

const after = ref<string>('')
const perPage = ref<number>(100)
const pages = ref<number>(1)

const afterLoading = ref(false)
const syncing = ref(false)

const lastResult = ref<SyncPaddleCustomersResult | null>(null)

const refreshAfter = async () => {
  afterLoading.value = true
  try {
    const res = await getSyncPaddleCustomersAfter()
    if (res.code === 0) {
      after.value = res.data || ''
    } else {
      ElMessage.error(res.msg || '获取 after 失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '获取 after 失败')
  } finally {
    afterLoading.value = false
  }
}

const handleSync = async () => {
  syncing.value = true
  try {
    // 每次同步前先刷新 after
    await refreshAfter()

    const res = await syncPaddleCustomers({
      after: after.value || undefined,
      perPage: typeof perPage.value === 'number' ? perPage.value : undefined,
      pages: typeof pages.value === 'number' ? pages.value : undefined
    })

    if (res.code === 0 && res.data) {
      lastResult.value = res.data
      after.value = res.data.after || after.value
      ElMessage.success(`同步完成：本次新建 ${res.data.created} 个用户`)
    } else {
      ElMessage.error(res.msg || '同步失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  refreshAfter()
})
</script>

<style scoped>
.paddle-sync-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
}

.label {
  color: #333;
  font-weight: 500;
}

.value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  color: #999;
  font-size: 12px;
}

.result-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.k {
  color: #666;
}

.v {
  color: #111;
}
</style>
