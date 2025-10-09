<template>
  <div class="app-daily-config-container">
    <div class="header">
      <h2>每日一图 · 配置</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <AppSearchSelect v-model="searchAppId" :width="'240px'" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="showCreate = true">新增配置</el-button>
      </div>
    </div>

    <el-table :data="rows" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column label="应用" min-width="200">
        <template #default="{ row }">
          <div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
            <span>{{ row.product?.name || '-' }}</span>
            <span style="color:#909399; font-size:12px;">AppID：{{ row.appId }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="isEnabled" label="启用" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled === 1 ? 'success' : 'info'">{{ row.isEnabled === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="selectionMode" label="选图模式" width="120" />
      <el-table-column label="固定图片" width="160">
        <template #default="{ row }">
          <div style="display:flex; align-items:center; gap:8px;">
            <el-image v-if="row.fixedImage" :src="imageUrl(row.fixedImage)" style="width:40px;height:40px;border-radius:6px;" fit="cover" />
            <span style="color:#606266;">{{ row.fixedImageId ?? '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="noRepeatDays" label="不重复天数" width="120" />
      <el-table-column prop="refreshTime" label="刷新时间" width="120" />
      <el-table-column prop="maxDailyPick" label="每日最多选取" width="140" />
      <el-table-column prop="useWeight" label="使用权重" width="120" />
      <el-table-column prop="remark" label="备注" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.remark || '-'" placement="top">
            <span class="ellipsis">{{ truncate(row.remark || '-', 40) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑配置</el-button>
          <el-divider direction="vertical" />
          <el-button type="warning" link @click="goEditRelations(row)">图片库</el-button>
          <el-divider direction="vertical" />
          <el-button type="success" link @click="goDailyPicks(row)">每日图片</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <ConfigCreateDialog v-model="showCreate" @success="fetchPage" />
    <ConfigEditDialog v-model="editVisible" :app-id="editAppId || undefined" @success="fetchPage" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAppDailyConfigPage } from '@/api/app-daily'
import type { AppDailyImageConfig } from '@/types/app-daily'
import { formatDateTime } from '@/utils/date'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import ConfigCreateDialog from '@/components/appDaily/ConfigCreateDialog.vue'
import ConfigEditDialog from '@/components/appDaily/ConfigEditDialog.vue'

const loading = ref(false)
const rows = ref<AppDailyImageConfig[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchAppId = ref<number | undefined>(undefined)
const router = useRouter()
const showCreate = ref(false)
const editVisible = ref(false)
const editAppId = ref<number | null>(null)
const truncate = (text: string, len = 80) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

// 计算图片 URL（兼容 previewUrl / formats.thumbnail / url）
const imageUrl = (img?: any): string => {
  if (!img) return ''
  return img.previewUrl || img?.formats?.thumbnail?.url || img.url || ''
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await fetchAppDailyConfigPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: 'created_at desc',
      appId: searchAppId.value ?? undefined
    })
    if (res.code === 0 && res.data) {
      rows.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取配置列表失败')
    }
  } catch (e) {
    // 提示在axios拦截器
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  searchAppId.value = undefined
  pageNum.value = 1
  fetchPage()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}

const openEdit = (row: AppDailyImageConfig) => {
  editAppId.value = row.appId
  editVisible.value = true
}

const goEditRelations = (row: AppDailyImageConfig) => {
  router.push({ name: 'AppDailyConfigEdit', params: { appId: row.appId }, query: { tab: 'relations' } })
}

const goDailyPicks = (row: AppDailyImageConfig) => {
  router.push({ name: 'AppDailyPicks', params: { appId: row.appId } })
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped lang="scss">
.app-daily-config-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.ellipsis {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
