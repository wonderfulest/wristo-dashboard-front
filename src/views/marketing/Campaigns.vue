<template>
  <div class="promotion-campaigns-page">
    <div class="page-header">
      <h2>营销推广活动</h2>
      <div>
        <el-button type="primary" @click="openCreate">新建活动</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <div class="search-filters">
      <el-input v-model="filters.name" placeholder="活动名称" clearable style="width: 200px; margin-right: 12px;" />
      <el-select v-model="filters.status" clearable placeholder="活动状态" style="width: 160px; margin-right: 12px;">
        <el-option label="草稿" :value="0" />
        <el-option label="进行中" :value="1" />
        <el-option label="已结束" :value="2" />
      </el-select>
      <el-select v-model="filters.isActive" clearable placeholder="启用状态" style="width: 160px; margin-right: 12px;">
        <el-option label="已启用" :value="1" />
        <el-option label="已停用" :value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="活动名称" min-width="180" />
      <el-table-column prop="description" label="描述" min-width="220">
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="时间" width="280">
        <template #default="{ row }">
          <div>
            <div>开始：{{ formatDateTime(row.startTime) }}</div>
            <div>结束：{{ formatDateTime(row.endTime) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="110" align="center">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive === 1" @change="(val:any)=>toggleActive(row, val)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="confirmDelete(row)">删除</el-button>
          <el-button type="primary" link @click="openItems(row)">配置应用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <CampaignCreateDialog v-model:visible="createVisible" @submit="onCreateSubmit" />
    <CampaignEditDialog v-model:visible="editVisible" :initial="dialog.current || null" @submit="onEditSubmit" />

    <!-- 活动应用配置弹窗 -->
    <el-dialog v-model="itemsDialog.visible" :title="`活动应用配置 - #${itemsDialog.campaign?.id} ${itemsDialog.campaign?.name || ''}`" width="900px">
      <div style="margin-bottom: 12px; display: flex; gap: 8px;">
        <el-button type="primary" @click="addItem">新增一行</el-button>
        <el-button @click="reloadItems" :loading="itemsDialog.loading">刷新</el-button>
      </div>
      <el-table :data="itemsDialog.items" style="width: 100%" v-loading="itemsDialog.loading">
        <el-table-column label="#" width="56">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="关联应用" min-width="260">
          <template #default="{ row }">
            <AppSearchSelect
              v-model="row.productId"
              placeholder="搜索选择应用"
              width="240px"
              @selected="onProductSelected(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.rank" :min="0" :max="9999" />
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.title" placeholder="展示标题（可选）" />
          </template>
        </el-table-column>
        <el-table-column label="图片URL" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.imageUrl" placeholder="图片链接（可选）" />
          </template>
        </el-table-column>
        <el-table-column label="点击跳转" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.clickUrl" placeholder="跳转链接（可选）" />
          </template>
        </el-table-column>
        <el-table-column label="启用" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="itemsDialog.visible = false">取消</el-button>
          <el-button type="primary" :loading="itemsDialog.saving" @click="saveItems">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCampaignPage, createCampaign, updateCampaign, deleteCampaign } from '@/api/promotion'
import type { PromotionCampaignVO, PromotionCampaignCreateDTO, PromotionCampaignUpdateDTO, PromotionCampaignPageQuery } from '@/types/promotion'
import type { PromotionItemDTO, PromotionItemVO } from '@/types/promotion'
import { listCampaignItems, replaceCampaignItems } from '@/api/promotion-item'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import type { Product } from '@/types/product'
import CampaignCreateDialog from '@/views/marketing/components/CampaignCreateDialog.vue'
import CampaignEditDialog from '@/views/marketing/components/CampaignEditDialog.vue'

const loading = ref(false)
const total = ref(0)
const list = ref<PromotionCampaignVO[]>([])

const query = reactive<PromotionCampaignPageQuery>({
  pageNum: 1,
  pageSize: 10,
  orderBy: 'createdAt desc'
})

const filters = reactive<{ name?: string; status?: number; isActive?: number }>({})

const dialog = reactive<{ current?: PromotionCampaignVO | null }>({ current: null })
const createVisible = ref(false)
const editVisible = ref(false)

// create/edit dialogs are handled by child components

const statusType = (status?: number) => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'info'
    default:
      return 'warning'
  }
}
const statusText = (status?: number) => {
  switch (status) {
    case 0:
      return '草稿'
    case 1:
      return '进行中'
    case 2:
      return '已结束'
    default:
      return '-'
  }
}

const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-')

const fetchPage = async () => {
  loading.value = true
  try {
    const params: PromotionCampaignPageQuery = {
      ...query,
      name: filters.name || undefined,
      status: filters.status,
      isActive: filters.isActive
    }
    const res = await getCampaignPage(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  fetchPage()
}
const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  fetchPage()
}

const handleSearch = () => {
  query.pageNum = 1
  fetchPage()
}
const resetSearch = () => {
  filters.name = undefined
  filters.status = undefined
  filters.isActive = undefined
  query.pageNum = 1
  fetchPage()
}

const openCreate = () => {
  dialog.current = null
  createVisible.value = true
}

const openEdit = (row: PromotionCampaignVO) => {
  dialog.current = row
  editVisible.value = true
}

const onCreateSubmit = async (payload: PromotionCampaignCreateDTO) => {
  try {
    await createCampaign(payload)
    ElMessage.success('创建成功')
    fetchPage()
  } catch (e:any) {
    ElMessage.error(e?.msg || '保存失败')
  }
}

const onEditSubmit = async (payload: PromotionCampaignUpdateDTO) => {
  if (!dialog.current) return
  try {
    await updateCampaign(dialog.current.id as number, payload)
    ElMessage.success('更新成功')
    fetchPage()
  } catch (e:any) {
    ElMessage.error(e?.msg || '保存失败')
  }
}

const confirmDelete = async (row: PromotionCampaignVO) => {
  try {
    await ElMessageBox.confirm(`确认删除活动「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteCampaign(row.id as number)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e:any) {
    ElMessage.error(e?.msg || '删除失败')
  }
}

const toggleActive = async (row: PromotionCampaignVO, val: boolean) => {
  try {
    await updateCampaign(row.id as number, { isActive: val ? 1 : 0 })
    ElMessage.success('状态已更新')
    fetchPage()
  } catch (e:any) {
    ElMessage.error(e?.msg || '更新失败')
  }
}

onMounted(() => {
  fetchPage()
})

// 活动应用配置逻辑
const itemsDialog = reactive<{ visible: boolean; campaign: PromotionCampaignVO | null; items: PromotionItemDTO[]; loading: boolean; saving: boolean }>({
  visible: false,
  campaign: null,
  items: [],
  loading: false,
  saving: false
})

const openItems = async (row: PromotionCampaignVO) => {
  itemsDialog.campaign = row
  itemsDialog.visible = true
  await loadItems()
}

const loadItems = async () => {
  if (!itemsDialog.campaign) return
  itemsDialog.loading = true
  try {
    const res = await listCampaignItems(itemsDialog.campaign.id as number)
    const voList = (res.data || []) as unknown as PromotionItemVO[]
    itemsDialog.items = voList.map(v => ({
      productId: v.productId,
      rank: v.rank ?? 0,
      title: v.title || '',
      imageUrl: v.imageUrl || '',
      clickUrl: v.clickUrl || '',
      isActive: v.isActive ?? 1
    }))
  } catch (e) {
    ElMessage.error('加载活动应用失败')
  } finally {
    itemsDialog.loading = false
  }
}

const reloadItems = () => loadItems()

const addItem = () => {
  itemsDialog.items.push({ productId: 0 as unknown as number, rank: 0, title: '', imageUrl: '', clickUrl: '', isActive: 1 })
}

const removeItem = (index: number) => {
  itemsDialog.items.splice(index, 1)
}

const saveItems = async () => {
  if (!itemsDialog.campaign) return
  for (const it of itemsDialog.items) {
    if (!it.productId || Number(it.productId) <= 0) {
      ElMessage.error('请为每一行选择应用')
      return
    }
  }
  itemsDialog.saving = true
  try {
    await replaceCampaignItems(itemsDialog.campaign.id as number, itemsDialog.items)
    ElMessage.success('保存成功')
    itemsDialog.visible = false
  } catch (e:any) {
    ElMessage.error(e?.msg || '保存失败')
  } finally {
    itemsDialog.saving = false
  }
}

const onProductSelected = (row: PromotionItemDTO, p: Product) => {
  row.title = p.name
  row.imageUrl = p.garminImageUrl
  row.clickUrl = p.garminStoreUrl
}
</script>

<style scoped>
.promotion-campaigns-page {
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
.search-filters {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
