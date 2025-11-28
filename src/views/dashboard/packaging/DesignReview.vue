<template>
  <div class="design-review-container">
    <div class="header">
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchName"
          placeholder="按设计名称搜索"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="searchUserId"
          placeholder="按用户ID搜索"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-select v-model="sortOrder" placeholder="排序方式" style="width: 150px" @change="handleSort">
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="创建时间升序" value="created_at:asc" />
        </el-select>
        <el-button @click="fetchDesigns">刷新</el-button>
        <el-button type="success" @click="handleBatchApprove" :disabled="!multipleSelection.length">批量通过</el-button>
      </div>
    </div>
    <el-table
      :data="designs"
      style="width: 90%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      row-key="designUid"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="产品信息" min-width="320">
        <template #default="{ row }">
          <div class="product-info">
            <el-image
              v-if="row.cover?.url || row.product?.garminImageUrl"
              :src="row.cover?.url || row.product?.garminImageUrl"
              :preview-src-list="[row.cover?.url || row.product?.garminImageUrl]"
              :z-index="5000"
              :preview-teleported="true"
              fit="cover"
              class="product-thumb"
              style="width: 56px; height: 56px"
            />
            <div class="product-meta">
              <div class="product-name">
                <a
                  v-if="row.product?.garminStoreUrl"
                  :href="row.product.garminStoreUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ row.name }}</a>
                <span v-else>{{ row.name }}</span>
                <a
                  v-if="row.designUid"
                  :href="`http://studio.wristo.io/design?id=${row.designUid}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="margin-left: 8px"
                >
                  <el-button link type="primary" size="small">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </a>
              </div>
              <div class="product-details">
                <span>appId: {{ row.product?.appId || '-' }}</span>
                <span>设计ID: {{ row.designUid }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="designStatus" label="状态" width="100" />
      <el-table-column label="用户" width="120">
        <template #default="{ row }">
          {{ row.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="支付" width="160">
        <template #default="{ row }">
          <div v-if="row.product?.payment">
            <div>{{ row.product.payment.paymentMethodDesc }}</div>
            <div>${{ row.product.payment.price }} {{ row.product.payment.currency }}</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="product.trialLasts" label="试用时长" width="200" />
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/date'
import { fetchDesignReviewPage, approveDesign, approveDesignBatch, rejectDesignWithComment } from '@/api/design-review'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Design } from '@/types/design'
import { Edit } from '@element-plus/icons-vue'

const designs = ref<any[]>([])
const multipleSelection = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchName = ref('')
const searchUserId = ref<string | number>('')
const sortOrder = ref('created_at:desc')

const fetchDesigns = async () => {
  loading.value = true
  try {
    const resp = await fetchDesignReviewPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      name: searchName.value ? searchName.value : undefined,
      userId: searchUserId.value ? Number(searchUserId.value) : undefined,
      designStatus: 'submitted',
      populate: 'cover,product,payment,user'
    }) as unknown as ApiResponse<PageResponse<Design>>
    designs.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (error) {
    ElMessage.error('获取审核列表失败')
  } finally {
    loading.value = false
  }
}

const handleBatchApprove = async () => {
  if (!multipleSelection.value.length) {
    ElMessage.warning('请先选择要通过的设计')
    return
  }
  const designUids = multipleSelection.value
    .map((item) => item.designUid)
    .filter((id: string) => !!id)

  if (!designUids.length) {
    ElMessage.warning('选中的记录中没有有效的设计ID')
    return
  }

  try {
    await ElMessageBox.confirm('确认将选中的设计全部通过审核？', '批量通过', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const resp: ApiResponse<boolean> = await approveDesignBatch(designUids) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('批量审核通过')
      multipleSelection.value = []
      fetchDesigns()
    } else {
      ElMessage.error(resp.msg || '操作失败')
    }
  } catch (error: any) {
    if (error?.action !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchDesigns()
}
const handleSort = () => {
  currentPage.value = 1
  fetchDesigns()
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchDesigns()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchDesigns()
}

const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val
}

const handleApprove = async (row: any) => {
  try {
    const resp: ApiResponse<boolean> = await approveDesign(row.designUid) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('审核通过')
      fetchDesigns()
    } else {
      ElMessage.error(resp.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReject = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝理由', '拒绝审核', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请填写拒绝原因（必填）',
      inputValidator: (val: string) => {
        if (!val || val.trim().length === 0) return '必须填写拒绝原因'
        return true
      }
    })
    const resp: ApiResponse<boolean> = await rejectDesignWithComment({
      designUid: row.designUid,
      reviewComment: (value as string).trim()
    }) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('已拒绝')
      fetchDesigns()
    } else {
      ElMessage.error(resp.msg || '操作失败')
    }
  } catch (error: any) {
    // 用户取消不提示错误
    if (error?.action !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  fetchDesigns()
})
</script>

<style scoped>
.design-review-container {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.product-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  flex: 0 0 56px;
}
.product-meta { min-width: 0; }
.product-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.product-name a { color: #409EFF; text-decoration: none; }
.product-name a:hover { text-decoration: underline; }
.product-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
.product-details span {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style> 