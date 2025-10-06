<template>
  <div class="app-daily-config-container">
    <div class="header">
      <h2>每日一图 · 配置</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchAppId"
          placeholder="按应用ID搜索（appId）"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="showCreate = true">新增配置</el-button>
      </div>
    </div>

    <el-table :data="rows" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="appId" label="AppID" width="120" />
      <el-table-column prop="isEnabled" label="启用" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled === 1 ? 'success' : 'info'">{{ row.isEnabled === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="selectionMode" label="选图模式" width="120" />
      <el-table-column prop="fixedImageId" label="固定图片ID" width="140" />
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
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="goEdit(row)">编辑</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAppDailyConfigPage, saveAppDailyConfig } from '@/api/app-daily'
import { uploadImage } from '@/api/image'
import type { AppDailyImageConfig } from '@/types/app-daily'
import { formatDateTime } from '@/utils/date'
import ConfigCreateDialog from '@/components/appDaily/ConfigCreateDialog.vue'

const loading = ref(false)
const rows = ref<AppDailyImageConfig[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchAppId = ref('')
const router = useRouter()
const showCreate = ref(false)
const imagePreviewMap = ref<Record<number, string>>({})

const truncate = (text: string, len = 80) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await fetchAppDailyConfigPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: 'created_at desc',
      appId: searchAppId.value ? Number(searchAppId.value) : undefined
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
  searchAppId.value = ''
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

const goEdit = (row: AppDailyImageConfig) => {
  router.push({ name: 'AppDailyConfigEdit', params: { appId: row.appId } })
}

onMounted(() => {
  fetchPage()
})

const handleUploadFixed = async (row: AppDailyImageConfig, uploadFile: any) => {
  try {
    const raw: File | null = uploadFile?.raw || null
    if (!raw) return
    const up = await uploadImage(raw)
    if (up.code !== 0 || !up.data) {
      ElMessage.error(up.msg || '上传失败')
      return
    }
    const img = up.data
    // 保存 fixedImageId
    const saveRes = await saveAppDailyConfig({ appId: row.appId, fixedImageId: img.id })
    if (saveRes.code === 0) {
      ElMessage.success('已更新固定图片')
      imagePreviewMap.value[row.appId] = img.previewUrl || (img as any)?.formats?.thumbnail?.url || img.url || ''
      // 同步本地行的 fixedImageId，避免必须刷新
      row.fixedImageId = img.id as unknown as number
    } else {
      ElMessage.error(saveRes.msg || '保存失败')
    }
  } catch (e) {
    // 错误提示在拦截器
  }
}
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
