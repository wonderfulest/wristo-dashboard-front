<template>
  <div class="fonts-container">
    <input ref="ttfInputRef" type="file" accept=".ttf" style="display: none" @change="onTtfFileChange" />
    <div class="header">
      <h2>字体管理</h2>
      <div class="header-toolbar">
          <div class="header-row header-row-actions">
          <el-button type="primary" plain @click="showUploadTtf = true">上传 TTF 字体</el-button>
          <span style="margin-left: 8px; color: #999;">|</span>
          <el-select v-model="batchStatus" placeholder="批量审核状态" clearable style="width: 180px">
            <el-option label="Submitted" value="submitted" />
            <el-option label="Pending" value="pending" />
            <el-option label="Approved" value="approved" />
            <el-option label="Rejected" value="rejected" />
          </el-select>
          <el-button type="success" :disabled="!selectedIds.length || !batchStatus" @click="handleBatchReview">
            批量审核<span v-if="selectedIds.length">（{{ selectedIds.length }}）</span>
          </el-button>
        </div>
        <div class="header-row header-row-filters">
          <el-input v-model="searchName" placeholder="按名称搜索" clearable style="width: 200px" @keyup.enter.native="handleSearch" />
          <el-input v-model="searchSlug" placeholder="按 slug 搜索" clearable style="width: 200px" @keyup.enter.native="handleSearch" />
          <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 160px">
            <el-option label="Submitted" value="submitted" />
            <el-option label="Pending" value="pending" />
            <el-option label="Approved" value="approved" />
            <el-option label="Rejected" value="rejected" />
          </el-select>
          <el-select v-model="searchType" placeholder="字体类型" clearable style="width: 180px">
            <el-option
              v-for="opt in fontTypeOptions"
              :key="opt.value"
              :label="opt.name"
              :value="opt.value"
            />
          </el-select>
          <el-select v-model="searchIsSystem" placeholder="是否系统字体" clearable style="width: 160px">
            <el-option label="系统字体" :value="1" />
            <el-option label="普通字体" :value="0" />
          </el-select>
          <el-select v-model="sortOrder" placeholder="排序方式" style="width: 180px" @change="handleSort">
            <el-option label="更新时间倒序" value="updated_at desc" />
            <el-option label="更新时间升序" value="updated_at asc" />
            <el-option label="创建时间倒序" value="created_at desc" />
            <el-option label="创建时间升序" value="created_at asc" />
            <el-option label="字形数倒序" value="glyph_count desc" />
            <el-option label="字形数升序" value="glyph_count asc" />
          </el-select>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      
      </div>
    </div>

    <el-table ref="tableRef" :data="fonts" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="postscriptName" label="PS 名称" min-width="160" />
      <el-table-column prop="slug" label="Slug" min-width="140" />
      <el-table-column prop="user.username" label="创建者" min-width="140">
        <template #default="{ row }">
          {{ row.user?.nickname || row.user?.username || '-' }}
        </template>
      </el-table-column>
       <!-- <el-table-column prop="fullName" label="名称" min-width="140" /> -->
      <!-- <el-table-column prop="family" label="字族" width="140" /> -->
      <el-table-column prop="language" label="语言" width="100" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="weight" label="字重" width="100" />
      <!-- <el-table-column prop="versionName" label="版本" width="120" /> -->
      <!-- <el-table-column prop="glyphCount" label="字形数" width="100" /> -->
      <el-table-column label="预览" min-width="220">
        <template #default="{ row }">
          <el-tooltip placement="top" effect="light" :show-after="150" :enterable="true" :append-to-body="true">
            <template #content>
              <FontPreview
                :id="row.id"
                :name="row.fullName"
                :url="row.ttfFile?.url || null"
                :type="row.type"
                :full="true"
                :size="32"
              />
            </template>
            <FontPreview :id="row.id" :name="row.fullName" :url="row.ttfFile?.url || null" :type="row.type" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="系统字体" width="120">
        <template #default="{ row }">
          <el-switch
            v-model="row.isSystem"
            :active-value="1"
            :inactive-value="0"
            @change="(val: number) => handleToggleSystem(row, val)"
          />
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="tagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="460" fixed="right">
        <template #default="{ row }">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <el-button
              v-if="row.ttfFile?.url"
              type="primary"
              size="small"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="handleUpdateTtf(row)">更新 TTF</el-button>
            <el-button type="info" size="small" @click="handleReview(row, 'submitted')">提交</el-button>
            <el-button type="success" size="small" @click="handleReview(row, 'approved')">通过</el-button>
            <el-button type="danger" size="small" @click="handleReview(row, 'rejected')">拒绝</el-button>
            <el-popconfirm title="确认删除该字体？" confirm-button-text="删除" cancel-button-text="取消" @confirm="() => handleRemove(row)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
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
    <FontEditDialog
      v-model="showEdit"
      :font="currentFont"
      :key="currentFont?.id || 'font-edit'"
      @saved="onSaved"
    />
    <FontTtfUploadDialog
      v-model:visible="showUploadTtf"
      @success="onUploadTtfSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { TableInstance } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { DesignFontVO } from '@/types/font'
import { pageFonts, reviewFont, reviewFontsBatch, removeFont, toggleFontSystem, updateFontTtf, getFontBySlug } from '@/api/fonts'
import type { EnumOption } from '@/api/common'
import { listEnumOptions } from '@/api/common'
import FontEditDialog from '@/components/FontEditDialog.vue'
import FontPreview from '@/components/FontPreview.vue'
import FontTtfUploadDialog from '@/components/FontTtfUploadDialog.vue'

const fonts = ref<DesignFontVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表格与多选
const tableRef = ref<TableInstance>()
const selectedIds = ref<number[]>([])
const batchStatus = ref<string | undefined>(undefined)

const ttfInputRef = ref<HTMLInputElement | null>(null)
const uploadingFontId = ref<number | null>(null)

const searchName = ref('')
const searchSlug = ref('')
const searchStatus = ref<string | undefined>(undefined)
const searchType = ref<string | undefined>(undefined)
const searchIsSystem = ref<number | undefined>(undefined)
const sortOrder = ref('updated_at desc')
const fontTypeOptions = ref<EnumOption[]>([])

const showUploadTtf = ref(false)

const tagType = (status: string) => {
  if (!status) return 'info'
  const s = status.toLowerCase()
  if (s.includes('approve')) return 'success'
  if (s.includes('reject')) return 'danger'
  if (s.includes('pending') || s.includes('submit')) return 'warning'
  return 'info'
}

// 切换是否为系统字体
const handleToggleSystem = async (row: DesignFontVO, val: number) => {
  const oldVal = row.isSystem
  row.isSystem = val
  try {
    const resp = await toggleFontSystem(row.id, val === 1)
    if ((resp as any).code === 0) {
      ElMessage.success(val === 1 ? '已设为系统字体' : '已取消系统字体')
    } else {
      row.isSystem = oldVal
    }
  } catch (e) {
    row.isSystem = oldVal
    ElMessage.error('操作失败')
  }
}

// 编辑弹窗
const showEdit = ref(false)
const currentFont = ref<DesignFontVO | null>(null)
watch(showEdit, (v) => {
  if (!v) currentFont.value = null
})
const openEdit = async (row: DesignFontVO) => {
  // 先用列表里的数据打开弹窗，避免因为接口失败导致弹窗不出现
  currentFont.value = row
  showEdit.value = true

  if (!row?.slug) {
    return
  }

  try {
    const resp = await getFontBySlug(row.slug) as unknown as ApiResponse<DesignFontVO>
    if (resp.code === 0 && resp.data) {
      currentFont.value = resp.data
    }
  } catch (e) {
    // 保留列表中的数据作为编辑内容
  }
}
const onSaved = () => {
  fetchPage()
}

// 多选变化
const handleSelectionChange = (selection: DesignFontVO[]) => {
  selectedIds.value = (selection || []).map((x) => x.id)
}

// 批量审核
const handleBatchReview = async () => {
  if (!selectedIds.value.length || !batchStatus.value) return
  try {
    const resp = (await reviewFontsBatch(selectedIds.value, batchStatus.value)) as unknown as ApiResponse<DesignFontVO[]>
    if (resp.code === 0) {
      ElMessage.success(`批量审核成功，共更新 ${resp.data?.length ?? 0} 项`)
      // 清空选择
      tableRef.value?.clearSelection?.()
      selectedIds.value = []
      fetchPage()
    }
  } catch (e) {
    ElMessage.error('批量审核失败')
  }
}

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = await pageFonts({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      name: searchName.value || undefined,
      slug: searchSlug.value || undefined,
      status: searchStatus.value || undefined,
      isSystem: searchIsSystem.value,
      type: searchType.value || undefined,
      populate: 'ttf,user'
    }) as unknown as ApiResponse<PageResponse<DesignFontVO>>
    fonts.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取字体列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPage()
}
const handleSort = () => {
  currentPage.value = 1
  fetchPage()
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchPage()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchPage()
}

const onUploadTtfSuccess = () => {
  fetchPage()
}

const handleReview = async (row: DesignFontVO, status: string) => {
	try {
		const resp = await reviewFont(row.slug, status) as unknown as ApiResponse<DesignFontVO>
		if (resp.code === 0) {
			ElMessage.success('操作成功')
			fetchPage()
		}
	} catch (e) {
		ElMessage.error('操作失败')
	}
}

const handleRemove = async (row: DesignFontVO) => {
  try {
    const resp = await removeFont(row.id) as unknown as ApiResponse<boolean>
    if (resp.code === 0 && resp.data) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const handleUpdateTtf = (row: DesignFontVO) => {
  uploadingFontId.value = row.id
  ttfInputRef.value?.click()
}

const handleDownload = async (row: DesignFontVO) => {
  if (!row.ttfFile?.url) return
  try {
    const response = await fetch(row.ttfFile.url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${row.slug}.ttf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (e) {
    ElMessage.error('下载失败')
  }
}

const onTtfFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || uploadingFontId.value == null) {
    if (target) target.value = ''
    return
  }
  try {
    loading.value = true
    const resp = await updateFontTtf(uploadingFontId.value, file) as unknown as ApiResponse<DesignFontVO>
    if (resp.code === 0) {
      ElMessage.success('TTF 更新成功')
      fetchPage()
    } else {
      ElMessage.error('TTF 更新失败')
    }
  } catch (e) {
    ElMessage.error('TTF 更新失败')
  } finally {
    loading.value = false
    uploadingFontId.value = null
    if (target) target.value = ''
  }
}

const loadFontTypeOptions = async () => {
  try {
    const resp = await listEnumOptions('DesignFontType') as unknown as ApiResponse<EnumOption[]>
    fontTypeOptions.value = resp.data || []
  } catch (e) {
    // ignore load error, keep options empty
  }
}

onMounted(() => {
  loadFontTypeOptions()
  fetchPage()
})
</script>

<style scoped>
.fonts-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.header-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>
