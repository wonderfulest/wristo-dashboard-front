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
      </div>
    </div>
    <el-table :data="designs" style="width: 100%" v-loading="loading">
      <el-table-column prop="designUid" label="设计ID" width="180" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="designStatus" label="状态" width="100" />
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.coverImage && row.coverImage.url"
            :src="row.coverImage.url"
            :preview-src-list="[row.coverImage.url]"
            fit="cover"
            style="width: 50px; height: 50px"
          />
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" width="120">
        <template #default="{ row }">
          {{ row.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="支付" width="160">
        <template #default="{ row }">
          <div v-if="row.payment">
            <div>{{ row.payment.paymentMethodDesc }}</div>
            <div>${{ row.payment.price }} {{ row.payment.currency }}</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" size="small" @click="handleReject(row)">不通过</el-button>
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
import { ElMessage } from 'element-plus'
import { formatDate } from '@/utils/date'
import { fetchDesignReviewPage, approveDesign, rejectDesign } from '@/api/design-review'
import type { ApiResponse, PageData } from '@/types/api'
import type { Design } from '@/types/design'

const designs = ref<any[]>([])
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
    }) as unknown as ApiResponse<PageData<Design>>
    designs.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (error) {
    ElMessage.error('获取审核列表失败')
  } finally {
    loading.value = false
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
    const resp: ApiResponse<boolean> = await rejectDesign(row.designUid) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('已拒绝')
      fetchDesigns()
    } else {
      ElMessage.error(resp.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
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
</style> 