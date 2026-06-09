<template>
  <div class="products-container">
    <div class="header">
      <h2>作品管理</h2>
      <div class="product-filter-bar">
        <el-input
          v-model="searchName"
          placeholder="按商品名称搜索"
          clearable
          class="filter-name-input"
          @keyup.enter.native="handleSearch"
        />
      
        <el-select v-model="sortOrder" placeholder="排序方式" class="filter-sort-select" @change="handleSort">
          <el-option label="创建时间升序" value="created_at:asc" />
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="更新时间升序" value="updated_at:asc" />
          <el-option label="更新时间倒序" value="updated_at:desc" />
          <el-option label="下载量倒序" value="download:desc" />
          <el-option label="下载量升序" value="download:asc" />
        </el-select>
        <el-select
          v-model="createdAtPreset"
          placeholder="创建时间"
          clearable
          class="filter-date-preset"
          @change="handleCreatedAtPresetChange"
        >
          <el-option
            v-for="option in createdAtPresetOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-date-picker
          v-model="createdAtRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :shortcuts="createdAtShortcuts"
          class="filter-date-range"
          @change="handleCreatedAtRangeChange"
        />
        <el-select
          v-model="selectedStatus"
          placeholder="按状态筛选"
          clearable
          class="filter-status-select"
          @change="handleFilterChange"
        >
          <el-option label="已上线" :value="1" />
          <el-option label="已下线" :value="0" />
        </el-select>
        <el-select
          v-model="selectedCategoryId"
          placeholder="按分类筛选"
          clearable
          filterable
          class="filter-category-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="cat in allCategories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
        <UserSelect
          v-model="selectedCreatorId"
          :role-authorities="['ROLE_DESIGNER']"
          placeholder="按创作者筛选"
          class="filter-creator-select"
          @change="handleFilterChange"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleRecentOnlineDownloads">近30天上线下载排行</el-button>
        <el-button @click="handleRefreshStats" :loading="refreshingStats">刷新统计</el-button>
      </div>
    </div>

    <el-table :data="products" style="width: 100%" v-loading="loading">
      <el-table-column prop="appId" label="ID" width="80" />
      <el-table-column label="商品信息" min-width="320">
        <template #default="{ row }">
          <AppProductInfo :product="row" :thumb-size="56" />
        </template>
      </el-table-column>
      
      <el-table-column label="作者" width="80">
        <template #default="{ row }">
          {{ row.user?.username || '-' }}
        </template>
      </el-table-column>
      <!-- <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="(val: number) => handleProductStatusChange(row, val)"
          />
        </template>
      </el-table-column> -->
      
      <el-table-column label="分类" width="220">
        <template #default="{ row }">
          <span style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
            <el-tag
              v-for="cat in row.categories"
              :key="cat.id"
              style="margin-right: 2px; margin-bottom: 2px;"
            >
              {{ cat.name }}
            </el-tag>
            <el-button
              size="small"
              type="primary"
              link
              :icon="Edit"
              @click="handleEditCategories(row)"
              style="margin-left: 4px; font-size: 16px;"
            />
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="download" label="下载量" width="80">
        <template #default="{ row }">
          {{ row.download }}
        </template>
      </el-table-column>
      <el-table-column prop="purchase" label="购买量" width="80">
        <template #default="{ row }">
          {{ row.purchase ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="80">
        <template #default="{ row }">
          ${{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="trialLasts" label="试用时长" width="100">
        <template #default="{ row }">
          {{ row.trialLasts }}小时
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="120">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              :type="row.status === 1 ? 'danger' : 'success'" 
              link 
              @click="handleToggleStatus(row)"
              :loading="statusLoadingMap.get(row.appId)"
            >
              {{ row.status === 1 ? '下线' : '上线' }}
            </el-button>
            <el-button 
              type="primary" 
              link 
              @click="openTransferDialog(row)"
            >
              转移应用
            </el-button>
            <el-button 
              type="primary" 
              link 
              @click="handleCreateTicket(row)"
            >
              创建工单
            </el-button>
            <el-button 
              type="primary" 
              link 
              @click="handleShare(row)"
            >
              Share
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
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
    <!-- 创建工单对话框 -->
    <el-dialog
      v-model="ticketDialogVisible"
      title="创建工单"
      width="500px"
    >
      <el-form :model="ticketForm" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="ticketForm.title" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="ticketForm.priority" placeholder="选择优先级" style="width: 180px">
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ticketForm.description" type="textarea" rows="4" placeholder="请填写工单描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ticketDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="ticketSubmitting" @click="submitCreateTicket">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 转移应用对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="转移应用所属设计师"
      width="480px"
    >
      <div v-if="productForTransfer">
        <p style="margin-bottom: 8px;">
          当前应用：<strong>{{ productForTransfer.name }}</strong>（ID：{{ productForTransfer.appId }}）
        </p>
        <p style="margin-bottom: 16px;">
          当前作者：{{ (productForTransfer as any)?.user?.username || '-' }}
        </p>
      </div>
      <div>
        <span style="display: inline-block; margin-bottom: 8px;">选择新的设计师：</span>
        <UserSelect
          v-model="transferTargetUserId"
          :role-authorities="['ROLE_DESIGNER']"
          placeholder="搜索并选择新设计师"
          style="width: 100%;"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="transferLoading"
            @click="confirmTransferOwner"
          >
            确认转移
          </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑商品"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="设计ID" prop="designId">
          <el-input v-model="form.designId" placeholder="请输入设计ID" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="form.price"
            :precision="2"
            :step="0.1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="下载量" prop="download">
          <el-input-number
            v-model="form.download"
            :precision="0"
            :step="1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="试用时长" prop="trialLasts">
          <el-input-number
            v-model="form.trialLasts"
            :precision="2"
            :step="0.1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="商品图片" prop="garminImageUrl">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-change="(file: any) => handleImageChange(file)"
            :before-upload="beforeUpload"
          >
            <img v-if="form.garminImageUrl" :src="form.garminImageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商店链接" prop="garminStoreUrl">
          <el-input v-model="form.garminStoreUrl" placeholder="请输入商店链接" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.categories"
            multiple
            filterable
            placeholder="请选择分类"
            style="width: 100%"
            :clearable="true"
            value-key="id"
          >
            <el-option
              v-for="cat in allCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="编辑产品分类"
      width="600px"
    >
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <el-checkbox-group v-model="selectedCategoryIds" style="display: flex; flex-direction: column;">
            <el-checkbox
              v-for="cat in allCategories"
              :key="cat.id"
              :label="cat.id"
              size="large"
            >
              {{ cat.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div style="flex-shrink: 0; width: 150px;">
          <el-image
            v-if="productForCategoryEdit?.garminImageUrl || productForCategoryEdit?.heroFile?.url"
            :src="productForCategoryEdit.garminImageUrl || productForCategoryEdit.heroFile?.url"
            style="width: 150px; height: 150px; border-radius: 8px;"
            fit="cover"
          />
          <div v-else style="width: 150px; height: 150px; background-color: #f5f7fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #909399;">
            无图片
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmCategoryUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Social Media Share Dialog -->
    <el-dialog
      v-model="shareDialogVisible"
      title="Social Media Share"
      width="780px"
      destroy-on-close
    >
      <div v-if="shareProduct" class="share-dialog-content">
        <!-- Product Preview Card -->
        <div class="share-product-card">
          <el-image
            v-if="shareProduct.garminImageUrl || shareProduct.heroFile?.url"
            :src="shareProduct.garminImageUrl || shareProduct.heroFile?.url"
            style="width: 80px; height: 80px; border-radius: 12px; flex-shrink: 0;"
            fit="cover"
          />
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 16px; color: #1d1d1f;">{{ shareProduct.name }}</div>
            <div style="color: #86868b; font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ shareProduct.description || 'No description' }}
            </div>
            <div style="margin-top: 6px; display: flex; gap: 8px; align-items: center;">
              <el-tag size="small" type="info">${{ shareProduct.price }}</el-tag>
              <el-tag size="small">{{ shareProduct.download ?? 0 }} downloads</el-tag>
            </div>
          </div>
        </div>

        <!-- Platform Selection -->
        <div class="share-section">
          <div class="share-section-title">Select Platforms</div>
          <el-checkbox-group v-model="selectedPlatforms" class="share-platform-grid">
            <el-checkbox
              v-for="p in availablePlatforms"
              :key="p.value"
              :label="p.value"
              class="share-platform-checkbox"
            >
              <span class="share-platform-icon">{{ p.icon }}</span>
              <span>{{ p.label }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- Optional Overrides -->
        <div class="share-section">
          <div class="share-section-title">Customize (Optional)</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <el-input v-model="shareOptions.title" placeholder="Custom title" clearable />
            <el-input v-model="shareOptions.subtitle" placeholder="Custom subtitle" clearable />
            <el-color-picker v-model="shareOptions.bgColor" show-alpha size="default" />
            <el-input v-model="shareOptions.brandLogo" placeholder="Brand logo URL (optional)" clearable />
          </div>
        </div>

        <!-- Generate Button -->
        <div style="text-align: center; margin: 20px 0 8px;">
          <el-button
            type="primary"
            size="large"
            :loading="shareGenerating"
            :disabled="selectedPlatforms.length === 0"
            @click="handleGenerateShareImages"
            style="min-width: 200px; border-radius: 10px;"
          >
            Generate Share Images
          </el-button>
        </div>

        <!-- Generated Results -->
        <div v-if="shareResult && shareResult.shareImages?.length" class="share-results">
          <div class="share-section-title">Generated Images</div>
          <div class="share-results-grid">
            <div
              v-for="img in shareResult.shareImages"
              :key="img.platform"
              class="share-result-card"
            >
              <div class="share-result-platform">{{ getPlatformLabel(img.platform) }}</div>
              <template v-if="img.imageUrl">
                <el-image
                  :src="img.imageUrl"
                  fit="cover"
                  class="share-result-image"
                  :preview-src-list="[img.imageUrl]"
                  preview-teleported
                />
                <div class="share-result-actions">
                  <el-button size="small" type="primary" link @click="copyToClipboard(img.imageUrl)">
                    Copy URL
                  </el-button>
                  <el-button size="small" type="primary" link @click="openInNewTab(img.imageUrl)">
                    Open
                  </el-button>
                </div>
              </template>
              <div v-else class="share-result-error">
                {{ img.error || 'Generation failed' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import { formatDate } from '@/utils/date'
import { fetchProductPage, updateProduct, updateProductCategories, toggleProductStatus, transferProductOwner, refreshProductStats } from '@/api/products'
import { uploadProductHeroImage } from '@/api/files'
import { fetchAllCategories } from '@/api/category'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'
import { createTicket } from '@/api/ticket'
import { useUserStore } from '@/store/user'
import UserSelect from '@/components/users/UserSelect.vue'
import { generateShareImages } from '@/api/share'
import type { ShareProductVO } from '@/api/share'

// 表格数据
const userStore = useUserStore()
const products = ref<Product[]>([])
const loading = ref(false)
const refreshingStats = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const allCategories = ref<Category[]>([])

// 表单相关
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const form = ref({
  appId: 0,
  designId: '',
  name: '',
  description: '',
  price: 0,
  garminImageUrl: '',
  garminStoreUrl: '',
  garminAppUuid: '',
  trialLasts: 0,
  status: 1,
  download: 0,
  categories: [] as Category[]
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
}

type TicketFormModel = {
  title: string
  description?: string
  priority?: string
  assigneeId?: number | null
  creatorId?: number | null
  dueDate?: string | null
  productId?: number | null
}

const ticketDialogVisible = ref(false)
const ticketSubmitting = ref(false)
const ticketForm = ref<TicketFormModel>({
  title: '',
  description: '',
  priority: 'medium',
  assigneeId: null,
  creatorId: null,
  dueDate: null,
  productId: null,
})

// 转移应用对话框
const transferDialogVisible = ref(false)
const transferLoading = ref(false)
const transferTargetUserId = ref<number | undefined>(undefined)
const productForTransfer = ref<Product | null>(null)

// 搜索和排序相关
const searchName = ref('')
const sortOrder = ref('created_at:desc')
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedCreatorId = ref<number | undefined>(undefined)
const selectedStatus = ref<number | undefined>(undefined)
const createdAtRange = ref<[string, string] | null>(null)
const createdAtPreset = ref('')

const createdAtPresetOptions = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '近7天', value: 'last7' },
  { label: '近30天', value: 'last30' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
]

const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}
const handleSort = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchProducts()
}

const formatDateForQuery = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
}

const buildDateRange = (preset: string): [string, string] | null => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (preset === 'today') {
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'last30') {
    start.setDate(start.getDate() - 29)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'thisMonth') {
    start.setDate(1)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1)
    end.setDate(0)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  return null
}

const createdAtShortcuts = createdAtPresetOptions.map(option => ({
  text: option.label,
  value: () => {
    const range = buildDateRange(option.value)
    if (!range) return []
    return range.map(date => new Date(`${date}T00:00:00`))
  }
}))

const handleCreatedAtPresetChange = (preset: string) => {
  createdAtRange.value = preset ? buildDateRange(preset) : null
  handleFilterChange()
}

const handleCreatedAtRangeChange = () => {
  createdAtPreset.value = ''
  handleFilterChange()
}

const handleRecentOnlineDownloads = () => {
  createdAtPreset.value = 'last30'
  createdAtRange.value = buildDateRange('last30')
  selectedStatus.value = 1
  sortOrder.value = 'download:desc'
  handleFilterChange()
}

// 手动刷新产品下载/购买统计
const handleRefreshStats = async () => {
  try {
    refreshingStats.value = true
    const res = await refreshProductStats()
    if (res.code === 0 && res.data) {
      ElMessage.success('已触发统计刷新')
      // 刷新当前列表数据
      fetchProducts()
    } else {
      ElMessage.error(res.msg || '刷新统计失败')
    }
  } catch (error) {
    ElMessage.error('刷新统计失败')
  } finally {
    refreshingStats.value = false
  }
}

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await fetchProductPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      name: searchName.value ? searchName.value : undefined,
      populate: '*',
      categoryId: selectedCategoryId.value || undefined,
      userId: selectedCreatorId.value || undefined,
      status: selectedStatus.value,
      createdAtStart: createdAtRange.value?.[0] ? `${createdAtRange.value[0]} 00:00:00` : undefined,
      createdAtEnd: createdAtRange.value?.[1] ? `${createdAtRange.value[1]} 23:59:59` : undefined,
    })
    if (res.code === 0) {
      products.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取商品列表失败')
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreateTicket = async (row: Product) => {
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }

  const assigneeId = (row as any)?.user?.id ?? userStore.userInfo.id

  ticketForm.value = {
    title: `针对作品的支持工单 - ${row.name}`,
    description: `针对作品（appId: ${row.appId}）创建支持工单。`,
    priority: 'medium',
    assigneeId,
    creatorId: userStore.userInfo.id,
    dueDate: null,
    productId: row.appId,
  }

  ticketDialogVisible.value = true
}

// 打开转移应用对话框
const openTransferDialog = (row: Product) => {
  productForTransfer.value = row
  // 默认不选中；如果你希望默认选当前作者，可以改成 row.user?.id
  transferTargetUserId.value = undefined
  transferDialogVisible.value = true
}

const submitCreateTicket = async () => {
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }

  try {
    ticketSubmitting.value = true
    const payload = {
      title: ticketForm.value.title,
      description: ticketForm.value.description,
      priority: ticketForm.value.priority,
      assigneeId: ticketForm.value.assigneeId ?? userStore.userInfo.id,
      creatorId: userStore.userInfo.id,
      dueDate: ticketForm.value.dueDate,
      productId: ticketForm.value.productId ?? null,
    }

    const res = await createTicket(payload as any)
    if (res.code === 0) {
      ElMessage.success('工单已创建')
      ticketDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '创建工单失败')
    }
  } catch (error) {
    ElMessage.error('创建工单失败')
  } finally {
    ticketSubmitting.value = false
  }
}

// 确认转移应用所属用户
const confirmTransferOwner = async () => {
  if (!productForTransfer.value) {
    ElMessage.error('未选择要转移的应用')
    return
  }
  if (!transferTargetUserId.value) {
    ElMessage.error('请选择新的设计师')
    return
  }

  try {
    transferLoading.value = true
    const res = await transferProductOwner(productForTransfer.value.appId, transferTargetUserId.value)
    if (res.code === 0) {
      ElMessage.success('应用所属用户已转移')
      transferDialogVisible.value = false
      // 重置状态
      productForTransfer.value = null
      transferTargetUserId.value = undefined
      // 刷新列表
      fetchProducts()
    } else {
      ElMessage.error(res.msg || '转移应用失败')
    }
  } catch (error) {
    ElMessage.error('转移应用失败')
  } finally {
    transferLoading.value = false
  }
}

// 获取所有分类
const fetchCategories = async () => {
  const res = await fetchAllCategories()
  if (res.code === 0 && res.data) {
    allCategories.value = res.data
  }
}


// 新增商品（已移除）

// 编辑商品
const handleEdit = (row: Product) => {
  form.value = { ...row, categories: row.categories || [] } as any
  dialogVisible.value = true
}

// 上传图片相关
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

async function handleImageChange(file: any) {
  if (!file || !file.raw) return;
  loading.value = true;
  const res = await uploadProductHeroImage(file.raw)
  if (res.code === 0 && res.data) {
    form.value.garminImageUrl = res.data as string
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(res.msg || '图片上传失败');
  }
  loading.value = false;
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const res = await updateProduct(form.value.appId, {
        name: form.value.name,
        description: form.value.description,
        price: form.value.price,
        garminImageUrl: form.value.garminImageUrl,
        garminStoreUrl: form.value.garminStoreUrl,
        trialLasts: form.value.trialLasts,
      })
      if (res.code === 0) {
        // 分类保存
        const categoryIds = (form.value.categories || []).map((c: any) => c.id)
        await updateProductCategories(form.value.appId, categoryIds)
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchProducts()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }
  })
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchProducts()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchProducts()
}

// 状态切换加载状态映射
const statusLoadingMap = ref<Map<number, boolean>>(new Map())

// 分类编辑弹窗
const categoryDialogVisible = ref(false)
const productForCategoryEdit = ref<Product | null>(null)
const selectedCategoryIds = ref<number[]>([])

// 分类增删逻辑 - 改为弹窗批量修改
const handleEditCategories = (row: Product) => {
  productForCategoryEdit.value = row;
  selectedCategoryIds.value = (row.categories || []).map((c: Category) => c.id);
  categoryDialogVisible.value = true;
}

const handleConfirmCategoryUpdate = async () => {
  if (!productForCategoryEdit.value) return;
  
  try {
    const res = await updateProductCategories(productForCategoryEdit.value.appId, selectedCategoryIds.value);
    if (res.code === 0) {
      ElMessage.success('分类更新成功');
      categoryDialogVisible.value = false;
      fetchProducts(); // Refresh the table
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新失败');
  }
}

// 切换产品上架/下架状态
const handleToggleStatus = async (row: Product) => {
  try {
    // 设置加载状态
    statusLoadingMap.value.set(row.appId, true)
    
    const newStatus = row.status === 1 ? 0 : 1
    const response = await toggleProductStatus(row.appId, newStatus)
    
    if (response.code === 0) {
      // 更新本地状态
      row.status = newStatus
      ElMessage.success(newStatus === 1 ? '产品已上线' : '产品已下线')
    } else {
      ElMessage.error(response.msg || '状态切换失败')
    }
  } catch (error) {
    console.error('切换产品状态失败:', error)
    ElMessage.error('状态切换失败')
  } finally {
    // 清除加载状态
    statusLoadingMap.value.set(row.appId, false)
  }
}

// ========== Social Media Share ==========
const shareDialogVisible = ref(false)
const shareGenerating = ref(false)
const shareProduct = ref<Product | null>(null)
const shareResult = ref<ShareProductVO | null>(null)
const selectedPlatforms = ref<string[]>(['facebook', 'instagram', 'x', 'pinterest'])
const shareOptions = ref({
  title: '',
  subtitle: '',
  bgColor: '',
  brandLogo: '',
})

const availablePlatforms = [
  { value: 'facebook', label: 'Facebook', icon: 'f' },
  { value: 'instagram', label: 'Instagram', icon: 'ig' },
  { value: 'x', label: 'X (Twitter)', icon: 'X' },
  { value: 'pinterest', label: 'Pinterest', icon: 'P' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { value: 'tiktok', label: 'TikTok', icon: 'Tk' },
  { value: 'xhs', label: 'Xiaohongshu', icon: 'XH' },
  { value: 'youtube', label: 'YouTube', icon: 'YT' },
]

const getPlatformLabel = (value: string) => {
  return availablePlatforms.find(p => p.value === value)?.label || value
}

const handleShare = (row: Product) => {
  shareProduct.value = row
  shareResult.value = null
  shareOptions.value = { title: '', subtitle: '', bgColor: '', brandLogo: '' }
  selectedPlatforms.value = ['facebook', 'instagram', 'x', 'pinterest']
  shareDialogVisible.value = true
}

const handleGenerateShareImages = async () => {
  if (!shareProduct.value) return
  try {
    shareGenerating.value = true
    shareResult.value = null
    const res = await generateShareImages({
      appId: shareProduct.value.appId,
      platforms: selectedPlatforms.value,
      title: shareOptions.value.title || undefined,
      subtitle: shareOptions.value.subtitle || undefined,
      bgColor: shareOptions.value.bgColor || undefined,
      brandLogo: shareOptions.value.brandLogo || undefined,
    })
    if (res.code === 0 && res.data) {
      shareResult.value = res.data
      ElMessage.success('Share images generated')
    } else {
      ElMessage.error(res.msg || 'Failed to generate share images')
    }
  } catch (error) {
    ElMessage.error('Failed to generate share images')
  } finally {
    shareGenerating.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('Copied to clipboard')
  } catch {
    ElMessage.error('Failed to copy')
  }
}

const openInNewTab = (url: string) => {
  window.open(url, '_blank')
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<style scoped>
.products-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  line-height: 32px;
  white-space: nowrap;
}

.product-filter-bar {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.filter-name-input {
  width: 160px;
}

.filter-sort-select {
  width: 140px;
}

.filter-date-preset {
  width: 112px;
}

.filter-date-range {
  width: 240px;
}

.filter-status-select {
  width: 118px;
}

.filter-category-select {
  width: 160px;
}

.filter-creator-select {
  width: 180px;
}

@media (max-width: 900px) {
  .header {
    flex-direction: column;
  }

  .product-filter-bar {
    justify-content: flex-start;
    width: 100%;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
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

/* ========== Social Media Share Dialog (Apple Design) ========== */
.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-product-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 14px;
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.share-platform-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.share-platform-checkbox {
  margin: 0 !important;
  padding: 10px 12px;
  border: 1.5px solid #e5e5ea;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: #fff;
}

.share-platform-checkbox:hover {
  border-color: #007aff;
  background: #f0f5ff;
}

.share-platform-checkbox.is-checked {
  border-color: #007aff;
  background: #e8f0fe;
}

.share-platform-icon {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-weight: 700;
  font-size: 11px;
  color: #fff;
  background: #1d1d1f;
  border-radius: 6px;
  margin-right: 6px;
  vertical-align: middle;
}

.share-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.share-result-card {
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s ease;
}

.share-result-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.share-result-platform {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
  background: #f5f5f7;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.share-result-image {
  width: 100%;
  height: 140px;
  display: block;
}

.share-result-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.share-result-error {
  padding: 16px 12px;
  font-size: 12px;
  color: #ff3b30;
  text-align: center;
}
</style>
