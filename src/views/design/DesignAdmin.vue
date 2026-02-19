<template>
  <div class="design-admin-container">
    <div class="header">
      <h2>设计列表</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchName"
          placeholder="按设计名称搜索"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="searchDesignUid"
          placeholder="按设计UID搜索"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />
        <UserSelect
          v-model="searchUserId"
          placeholder="按设计师搜索"
          style="width: 220px"
        />
        <el-select
          v-model="searchIsTemplate"
          placeholder="是否模板"
          clearable
          style="width: 140px"
        >
          <el-option label="全部" :value="undefined" />
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
        <el-select
          v-model="sortOrder"
          placeholder="排序方式"
          style="width: 180px"
          @change="handleSort"
        >
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="创建时间升序" value="created_at:asc" />
          <el-option label="更新时间倒序" value="updated_at:desc" />
          <el-option label="更新时间升序" value="updated_at:asc" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-table :data="designs" style="width: 100%" v-loading="loading">
      <el-table-column prop="designUid" label="设计UID" width="200" />
      <el-table-column label="应用信息" min-width="320">
        <template #default="{ row }">
          <AppProductInfo
            v-if="row.product"
            :product="row.product"
            :thumb-size="56"
          />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="设计师" width="160">
        <template #default="{ row }">
          {{ row.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="是否模板" width="120" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isTemplate === 1"
            :active-value="true"
            :inactive-value="false"
            @change="(val: boolean) => handleToggleTemplate(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="designStatus" label="状态" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
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
import type { DesignPageQueryDTO, Design } from '@/types/design'
import type { ApiResponse, PageResponse } from '@/types/api'
import { fetchDesignPage, updateDesignTemplateFlag } from '@/api/design-admin'
import UserSelect from '@/components/users/UserSelect.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

const designs = ref<Design[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchName = ref('')
const searchDesignUid = ref('')
const searchUserId = ref<number | undefined>(undefined)
const searchIsTemplate = ref<number | undefined>(undefined)
const sortOrder = ref('created_at:desc')

const fetchDesigns = async () => {
  loading.value = true
  try {
    const params: DesignPageQueryDTO = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      name: searchName.value || undefined,
      designUid: searchDesignUid.value || undefined,
      userId: searchUserId.value,
      isTemplate: searchIsTemplate.value,
      populate: 'user,product,image'
    }
    const resp = await fetchDesignPage(params) as unknown as ApiResponse<PageResponse<Design>>
    if (resp.code === 0 && resp.data) {
      designs.value = resp.data.list || []
      total.value = resp.data.total || 0
    } else {
      ElMessage.error(resp.msg || '获取设计列表失败')
    }
  } catch (error) {
    ElMessage.error('获取设计列表失败')
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

const handleToggleTemplate = async (row: Design, val: boolean) => {
  const newValue = val ? 1 : 0
  try {
    await ElMessageBox.confirm(
      `确认将设计 “${row.name}” 设置为${newValue === 1 ? '模板' : '非模板'}吗？`,
      '确认操作',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    // 用户取消时，刷新列表恢复开关状态
    fetchDesigns()
    return
  }

  try {
    const resp = await updateDesignTemplateFlag(row.designUid, newValue) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('更新成功')
      row.isTemplate = newValue
    } else {
      ElMessage.error(resp.msg || '更新失败')
      fetchDesigns()
    }
  } catch (error) {
    ElMessage.error('更新失败')
    fetchDesigns()
  }
}

onMounted(() => {
  fetchDesigns()
})
</script>

<style scoped>
.design-admin-container {
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
