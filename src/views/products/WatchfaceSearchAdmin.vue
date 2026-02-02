<template>
  <div class="watchface-search-admin-container">
    <div class="header">
      <h2>搜索引擎管理</h2>

      <div class="toolbar">
        <el-button type="primary" :loading="rebuildLoading" @click="handleRebuildAll(true)">
          重建索引（清空后重建）
        </el-button>
        <el-button :loading="rebuildLoading" @click="handleRebuildAll(false)">
          重建索引（不清空）
        </el-button>
        <el-button :loading="settingsLoading" @click="handleReloadSettings">重载设置</el-button>
        <el-switch
          v-model="enabled"
          :loading="switchLoading"
          active-text="启用搜索索引"
          inactive-text="禁用搜索索引"
          @change="handleSwitch"
        />
      </div>

      <div class="status" v-loading="statusLoading">
        <el-descriptions title="索引状态" :column="2" border v-if="status">
          <el-descriptions-item label="索引名">{{ status.indexName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="文档数">{{ status.docCount ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近重建时间">{{ status.lastRebuildTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="健康状态">{{ status.health || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="search-header">
          <span>文档搜索</span>
          <div class="search-controls">
            <el-input
              v-model="keyword"
              placeholder="按关键词搜索"
              clearable
              style="width: 260px"
              @keyup.enter.native="handleSearch"
            />
            <el-input-number v-model="limit" :min="1" :max="100" label="Limit" />
            <el-button type="primary" :loading="searchLoading" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="searchResults" style="width: 100%" v-loading="searchLoading">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="downloads" label="下载量" width="120" />
        <el-table-column prop="rating" label="评分" width="120" />
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">{{ formatTimestamp(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDoc(row.id)">查看 Doc</el-button>
            <el-button type="warning" link @click="rebuildOneDoc(row.id)">重建 Doc</el-button>
            <el-button type="danger" link @click="deleteOneDoc(row.id)">删除 Doc</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="consistency-card" shadow="never">
      <template #header>
        <div class="consistency-header">
          <span>索引一致性检查</span>
          <div class="consistency-controls">
            <el-input-number
              v-model="sampleLimit"
              :min="10"
              :max="10000"
              label="Sample Limit"
            />
            <el-button type="primary" :loading="consistencyLoading" @click="handleCheckConsistency">
              执行检查
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="consistencyLoading">
        <el-descriptions v-if="consistency" :column="2" border>
          <el-descriptions-item label="DB 数量">{{ consistency.dbCount ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="索引数量">{{ consistency.indexCount ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="缺失 ID 数">{{ consistency.missingIds?.length ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="多余 ID 数">{{ consistency.extraIds?.length ?? 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-dialog v-model="docDialogVisible" title="搜索文档详情" width="720px">
      <div v-loading="docLoading">
        <pre v-if="currentDoc" class="doc-pre">{{ JSON.stringify(currentDoc, null, 2) }}</pre>
        <div v-else>暂无数据</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  WatchfaceSearchStatusVO,
  WatchfaceIndexConsistencyVO,
  WatchfaceSearchDocVO,
} from '@/types/watchface-search'
import {
  rebuildAll,
  rebuildOne,
  fetchStatus,
  fetchCount,
  reloadSettings,
  switchIndex,
  searchDocs,
  getDoc,
  deleteDoc,
  checkConsistency,
} from '@/api/watchface-search'

const status = ref<WatchfaceSearchStatusVO | null>(null)
const statusLoading = ref(false)

const enabled = ref(true)
const switchLoading = ref(false)

const rebuildLoading = ref(false)
const settingsLoading = ref(false)

const keyword = ref('')
const limit = ref(10)
const searchResults = ref<WatchfaceSearchDocVO[]>([])
const searchLoading = ref(false)

const sampleLimit = ref(200)
const consistency = ref<WatchfaceIndexConsistencyVO | null>(null)
const consistencyLoading = ref(false)

const docDialogVisible = ref(false)
const docLoading = ref(false)
const currentDoc = ref<WatchfaceSearchDocVO | null>(null)

const formatTimestamp = (ts?: number) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
}

const loadStatus = async () => {
  try {
    statusLoading.value = true
    const res = await fetchStatus()
    if (res.code === 0 && res.data) {
      status.value = res.data
    }
    // 同步一下 docCount，用于界面展示
    const countRes = await fetchCount()
    if (countRes.code === 0 && typeof countRes.data === 'number') {
      if (!status.value) status.value = {}
      status.value.docCount = countRes.data
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '加载状态失败')
  } finally {
    statusLoading.value = false
  }
}

const handleRebuildAll = async (clear: boolean) => {
  try {
    await ElMessageBox.confirm(
      clear ? '确认重建索引（会清空现有索引）？' : '确认重建索引（不清空现有索引）？',
      '确认',
      { type: 'warning' },
    )
    rebuildLoading.value = true
    const res = await rebuildAll(clear)
    if (res.code === 0 && res.data) {
      ElMessage.success(res.data.message || '重建任务已触发')
      await loadStatus()
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '重建失败')
  } finally {
    rebuildLoading.value = false
  }
}

const handleReloadSettings = async () => {
  try {
    settingsLoading.value = true
    const res = await reloadSettings()
    if (res.code === 0) ElMessage.success('重载设置成功')
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '重载设置失败')
  } finally {
    settingsLoading.value = false
  }
}

const handleSwitch = async (val: boolean) => {
  try {
    switchLoading.value = true
    const res = await switchIndex(val)
    if (res.code === 0) ElMessage.success('已更新索引开关')
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '更新索引开关失败')
  } finally {
    switchLoading.value = false
  }
}

const handleSearch = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  try {
    searchLoading.value = true
    const res = await searchDocs(keyword.value.trim(), limit.value)
    if (res.code === 0 && res.data) {
      searchResults.value = res.data
    } else {
      searchResults.value = []
    }
  } catch (e: any) {
    searchResults.value = []
    ElMessage.error(e?.msg || e?.message || '搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const openDoc = async (id: number) => {
  try {
    docDialogVisible.value = true
    docLoading.value = true
    currentDoc.value = null
    const res = await getDoc(id)
    if (res.code === 0) currentDoc.value = (res.data as any) || null
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '加载文档失败')
  } finally {
    docLoading.value = false
  }
}

const rebuildOneDoc = async (id: number) => {
  try {
    await ElMessageBox.confirm(`确认重建文档 ID ${id} 吗？`, '确认', { type: 'warning' })
    const res = await rebuildOne(id)
    if (res.code === 0) {
      ElMessage.success('重建成功')
      await handleSearch()
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '重建失败')
  }
}

const deleteOneDoc = async (id: number) => {
  try {
    await ElMessageBox.confirm(`确认删除文档 ID ${id} 吗？`, '确认', { type: 'warning' })
    const res = await deleteDoc(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      await handleSearch()
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '删除失败')
  }
}

const handleCheckConsistency = async () => {
  try {
    consistencyLoading.value = true
    const res = await checkConsistency(sampleLimit.value)
    if (res.code === 0 && res.data) {
      consistency.value = res.data
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '检查失败')
  } finally {
    consistencyLoading.value = false
  }
}

onMounted(() => {
  loadStatus()
})
</script>

<style scoped lang="scss">
.watchface-search-admin-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 600;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.status {
  margin-bottom: 16px;
}

.search-card,
.consistency-card {
  margin-top: 16px;
}

.search-header,
.consistency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-controls,
.consistency-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.doc-pre {
  margin: 0;
  max-height: 480px;
  overflow: auto;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
}
</style>
