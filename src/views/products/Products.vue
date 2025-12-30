<template>
  <div class="products-container">
    <div class="header">
      <h2>作品管理</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchName"
          placeholder="按商品名称搜索"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
      
        <el-select v-model="sortOrder" placeholder="排序方式" style="width: 150px" @change="handleSort">
          <el-option label="创建时间升序" value="created_at:asc" />
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="更新时间升序" value="updated_at:asc" />
          <el-option label="更新时间倒序" value="updated_at:desc" />
          <el-option label="下载量倒序" value="download:desc" />
          <el-option label="下载量升序" value="download:asc" />
        </el-select>
        <el-select
          v-model="selectedCategoryId"
          placeholder="按分类筛选"
          clearable
          filterable
          style="width: 200px"
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
          @change="handleFilterChange"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
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
      <el-table-column label="操作" width="260" fixed="right">
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
              @click="handleCreateTicket(row)"
            >
              创建工单
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import { formatDate } from '@/utils/date'
import { fetchProductPage, updateProduct, updateProductCategories, toggleProductStatus } from '@/api/products'
import { uploadProductHeroImage } from '@/api/files'
import { fetchAllCategories } from '@/api/category'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'
import { createTicket } from '@/api/ticket'
import { useUserStore } from '@/store/user'
import UserSelect from '@/components/users/UserSelect.vue'

// 表格数据
const userStore = useUserStore()
const products = ref<Product[]>([])
const loading = ref(false)
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

// 搜索和排序相关
const searchName = ref('')
const sortOrder = ref('created_at:desc')
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedCreatorId = ref<number | undefined>(undefined)

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
  align-items: center;
  margin-bottom: 20px;
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
</style>