<template>
  <div class="meter-score-page">
    <div class="header">
      <ListSearchPanel>
        <div class="list-search-field">
          <span class="list-search-label">展示方式</span>
          <el-radio-group v-model="mode" aria-label="展示方式" @change="fetchData">
            <el-radio-button value="top">Top N</el-radio-button>
            <el-radio-button value="page">分页</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="mode === 'top'" class="list-search-field">
          <span class="list-search-label">排行数量</span>
          <el-input-number v-model="topN" aria-label="排行数量" :min="1" :max="100" :step="5" />
        </div>
        <template v-if="mode === 'page'">
          <div class="list-search-field">
            <span class="list-search-label">页码</span>
            <el-input-number v-model="pageNum" aria-label="页码" :min="1" :step="1" />
          </div>
          <div class="list-search-field">
            <span class="list-search-label">每页条数</span>
            <el-input-number v-model="pageSize" aria-label="每页条数" :min="1" :max="100" :step="10" />
          </div>
        </template>
        <template #query>
          <el-button type="primary" :loading="loading" @click="fetchData">查询</el-button>
        </template>
      </ListSearchPanel>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%" stripe>
      <TableActionColumn>
        <template #default="{ row }">
          <el-button type="primary" link @click="goDeviceDetail(row.appId)">详情</el-button>
        </template>
      </TableActionColumn>

      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="appId" label="App ID" min-width="180" />
      <el-table-column label="健康评分" min-width="200">
        <template #default="{ row }">
          <div class="score-cell">
            <el-progress
              :percentage="Math.round((row.score ?? 0) * 100)"
              :color="scoreColor(row.score)"
              :stroke-width="16"
              :text-inside="true"
              style="flex: 1"
            />
            <span class="score-value">{{ (row.score ?? 0).toFixed(4) }}</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="mode === 'page'" class="pagination">
      <el-button :disabled="pageNum <= 1" @click="pageNum--; fetchData()">上一页</el-button>
      <span class="page-info">第 {{ pageNum }} 页</span>
      <el-button :disabled="list.length < pageSize" @click="pageNum++; fetchData()">下一页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getScoreTop, getScorePage } from '@/api/meter'
import type { AppScoreVO } from '@/types/meter'

const router = useRouter()
const mode = ref<'top' | 'page'>('top')
const topN = ref(20)
const pageNum = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const list = ref<AppScoreVO[]>([])

const goDeviceDetail = (appId: string) => {
  router.push({
    path: '/meter/app',
    query: { appId }
  })
}

const scoreColor = (score: number) => {
  if (score >= 0.7) return '#67C23A'
  if (score >= 0.4) return '#E6A23C'
  return '#F56C6C'
}

const fetchData = async () => {
  loading.value = true
  try {
    if (mode.value === 'top') {
      const res = await getScoreTop(topN.value)
      list.value = res.data || []
    } else {
      const res = await getScorePage(pageNum.value, pageSize.value)
      list.value = res.data || []
    }
  } catch {
    ElMessage.error('获取评分数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.meter-score-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.filters { display: flex; gap: 12px; align-items: center; }
.score-cell { display: flex; align-items: center; gap: 12px; }
.score-value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; min-width: 60px; text-align: right; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-info { font-size: 14px; color: #606266; }
</style>
