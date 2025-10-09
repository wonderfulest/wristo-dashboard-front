<template>
  <div class="app-daily-picks">
    <div class="header">
      <h2>每日图片 · 列表（AppID: {{ appId }}）</h2>
      <div class="actions">
        <el-date-picker
          v-model="fromNaturalDay"
          type="date"
          placeholder="从自然日开始筛选"
          value-format="YYYY-MM-DD"
          style="width: 180px; margin-right: 8px;"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" :loading="generating" @click="handleGenerate">生成未来记录</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="naturalDay" label="自然日" width="120" />
      <el-table-column prop="dayOfYear" label="年内天数" width="100" />
      <el-table-column prop="imageId" label="图片ID" width="120" />
      <el-table-column label="图片" min-width="220">
        <template #default="{ row }">
          <div style="display:flex; align-items:center; gap:8px;">
            <el-image
              v-if="row.image && getImagePreview(row.image)"
              :src="getImagePreview(row.image)"
              style="width:40px;height:40px;border-radius:4px;"
              fit="cover"
            />
            <div v-else>
              <div>ID: {{ row.imageId }}</div>
              <div style="color:#909399; font-size:12px; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                {{ row.image?.name || getImagePreview(row.image) || '-' }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="是否有效" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="选取时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.chosenAt) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageAppDailyPicks, generateAppDailyPicks } from '@/api/app-daily'
import type { AppDailyImagePickVO } from '@/types/app-daily'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const appId = Number(route.params.appId)

const loading = ref(false)
const generating = ref(false)
const rows = ref<AppDailyImagePickVO[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const fromNaturalDay = ref<string | undefined>(undefined)

// 默认日期：今天的前面三天（YYYY-MM-DD）
const formatYmd = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const defaultFromDay = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 3)
  return formatYmd(d)
}

// 计算图片 URL（兼容 previewUrl / formats.thumbnail / url）
const getImagePreview = (img?: any): string => {
  if (!img) return ''
  return img.previewUrl || img?.formats?.thumbnail?.url || img.url || ''
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageAppDailyPicks({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      appId,
      fromNaturalDay: fromNaturalDay.value || undefined,
      orderBy: 'natural_day asc'
    })
    if (res.code === 0 && res.data) {
      rows.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取每日图片失败')
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  fromNaturalDay.value = defaultFromDay()
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

const handleGenerate = async () => {
  try {
    const { value } = await ElMessageBox.prompt('生成未来天数（默认100）', '生成每日图片', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^(?:[1-9]\d{0,2}|1000)$/,
      inputErrorMessage: '请输入 1-1000 的数字',
      inputValue: '100'
    })
    const days = Number(value)
    generating.value = true
    const res = await generateAppDailyPicks(appId, days || 100)
    if (res.code === 0) {
      ElMessage.success('生成成功')
      fetchPage()
    } else {
      ElMessage.error(res.msg || '生成失败')
    }
  } catch (e) {
    // canceled or error
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  if (!appId || Number.isNaN(appId)) {
    ElMessage.error('无效的 AppID')
    return
  }
  if (!fromNaturalDay.value) fromNaturalDay.value = defaultFromDay()
  fetchPage()
})
</script>

<style scoped lang="scss">
.app-daily-picks {
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
