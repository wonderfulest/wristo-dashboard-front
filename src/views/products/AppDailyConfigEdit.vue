<template>
  <div class="app-daily-config-edit">
    <div class="header">
      <h2>每日一图 · 配置编辑（AppID: {{ appId }}）</h2>
      <div class="actions">
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>

    <el-card class="section" shadow="never">
      <template #header>
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
          <span>基础配置</span>
          <el-button link type="primary" @click="showBase = !showBase">{{ showBase ? '收起' : '展开' }}</el-button>
        </div>
      </template>
      <div v-show="showBase">
        <el-skeleton v-if="loadingConfig" :rows="4" animated />
        <template v-else>
        <el-descriptions :column="2" border v-if="config">
          <el-descriptions-item label="应用名（AppId）">{{ (config.product?.name || '-') + '（' + config.appId + '）' }}</el-descriptions-item>
          <el-descriptions-item label="启用">
            <el-tag :type="config.isEnabled === 1 ? 'success' : 'info'">{{ config.isEnabled === 1 ? '是' : '否' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="选图模式">{{ config.selectionMode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="固定图片">
            <div v-if="config.fixedImage || config.fixedImageId" style="display:flex; align-items:center; gap:8px;">
              <el-image
                v-if="config.fixedImage && getImagePreview(config.fixedImage)"
                :src="getImagePreview(config.fixedImage)"
                style="width:48px;height:48px;border-radius:4px;"
                fit="cover"
              />
              <div>
                <div>ID: {{ config.fixedImageId ?? '-' }}</div>
                <div style="color:#909399; font-size:12px; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  {{ config.fixedImage?.name || getImagePreview(config.fixedImage) || '-' }}
                </div>
              </div>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="不重复天数">{{ config.noRepeatDays ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="刷新时间">{{ config.refreshTime ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="每日最多选取">{{ config.maxDailyPick ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="使用权重">{{ config.useWeight ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ config.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(config.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ formatDateTime(config.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
        <div v-else class="empty-tip">暂无配置数据</div>
        </template>
      </div>
    </el-card>

    <el-card class="section" shadow="never" style="margin-top: 16px;">
      <template #header>
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
          <span>图片关系（权重/排序）</span>
          <div>
            <el-button link type="primary" @click="showRelations = !showRelations" style="margin-right:8px;">{{ showRelations ? '收起' : '展开' }}</el-button>
            <el-button type="primary" @click="createDialogVisible = true">新增图片</el-button>
          </div>
        </div>
      </template>
      <div v-if="showRelations">
        <el-table ref="relationsTableRef" :data="relations" v-loading="loadingRelations" style="width: 100%">
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column label="图片" width="200">
            <template #default="{ row }">
              <div style="display:flex; align-items:center; gap:8px;">
                <el-image v-if="getImagePreview(row.image)" :src="getImagePreview(row.image)" style="width:40px;height:40px;border-radius:4px;" fit="cover" />
                <div v-else>
                  <div>ID: {{ row.imageId }}</div>
                  <div style="color:#909399; font-size:12px; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ row.image?.name || getImagePreview(row.image) || '-' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="权重" width="100" />
          <el-table-column prop="sort" label="排序" width="100" />
          <el-table-column prop="isActive" label="启用" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="onEditRelation(row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-switch
                :model-value="row.isActive === 1"
                @change="(val: boolean) => onToggleActive(row, val)"
              />
            </template>
          </el-table-column>
        </el-table>
        <div style="display:flex; justify-content:flex-end; margin-top: 12px;">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            :current-page="pageNum"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    <RelationCreateDialog
      v-model="createDialogVisible"
      :appId="appId"
      @success="fetchRelations"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { getAppDailyConfigDetail, pageAppDailyRelations, setRelationActive } from '@/api/app-daily'
import RelationCreateDialog from '@/components/appDaily/RelationCreateDialog.vue'
import type { AppDailyImageConfig, AppDailyImageRelation, ImageVO } from '@/types/app-daily'

const route = useRoute()
const router = useRouter()
const appId = Number(route.params.appId)

const loadingConfig = ref(false)
const loadingRelations = ref(false)
const config = ref<AppDailyImageConfig | null>(null)
const relations = ref<AppDailyImageRelation[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const createDialogVisible = ref(false)
const showRelations = ref(true)
const showBase = ref(true)

// create relation handled in dialog component
const getImagePreview = (img?: ImageVO | null): string => {
  if (!img) return ''
  return (img as any).previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any).url || ''
}

const fetchConfig = async () => {
  loadingConfig.value = true
  try {
    const res = await getAppDailyConfigDetail(appId)
    if (res.code === 0) {
      config.value = res.data as AppDailyImageConfig
    } else {
      ElMessage.error(res.msg || '获取配置失败')
    }
  } catch (e) {
    ElMessage.error('网络异常，获取配置失败')
  } finally {
    loadingConfig.value = false
  }
}

const fetchRelations = async () => {
  loadingRelations.value = true
  try {
    const res = await pageAppDailyRelations({ appId, pageNum: pageNum.value, pageSize: pageSize.value })
    if (res.code === 0 && res.data) {
      relations.value = (res.data.list || []) as AppDailyImageRelation[]
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取关系列表失败')
    }
  } catch (e) {
    ElMessage.error('网络异常，获取关系列表失败')
  } finally {
    loadingRelations.value = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  pageNum.value = 1
  fetchRelations()
}

const handleCurrentChange = (val: number) => {
  pageNum.value = val
  fetchRelations()
}

// 切换图片关系启用状态（乐观更新）
const onToggleActive = async (row: AppDailyImageRelation, val: boolean) => {
  const prev = row.isActive
  row.isActive = val ? 1 : 0
  try {
    const res = await setRelationActive(row.id, row.isActive)
    if ((res as any)?.code === 0) {
      ElMessage.success(val ? '已启用' : '已停用')
    } else {
      row.isActive = prev
      ElMessage.error(((res as any)?.msg) || '操作失败')
    }
  } catch (e) {
    row.isActive = prev
    ElMessage.error('网络异常，操作失败')
  }
}

// 编辑关系（占位，后续可扩展为编辑权重/排序弹窗）
const onEditRelation = (row: AppDailyImageRelation) => {
  ElMessage.info(`编辑关系（ID: ${row.id}）功能即将支持`)
}

const goBack = () => {
  router.push({ name: 'AppDailyConfig' })
}

onMounted(() => {
  if (!appId || Number.isNaN(appId)) {
    ElMessage.error('无效的 AppID')
    router.replace({ name: 'AppDailyConfig' })
    return
  }
  fetchConfig()
  fetchRelations()
})
</script>

<style scoped lang="scss">
.app-daily-config-edit {
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section {
  margin-bottom: 16px;
}
.card-header {
  font-weight: 600;
}
.empty-tip {
  color: #909399;
}
</style>
