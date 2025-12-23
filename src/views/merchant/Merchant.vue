<template>
  <div class="merchant-page">
    <div class="page-header">
      <h2>商家用户</h2>
    </div>

    <div class="filters">
      <UserSelect v-model="searchUserId" placeholder="按商家用户搜索" @change="handleUserChange" />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="users" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="100" />
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row?.avatar"
            :src="row.avatar"
            style="width: 40px; height: 40px; border-radius: 50%;"
            fit="cover"
            :preview-src-list="[row.avatar]"
            preview-teleported
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" width="160" />
      <el-table-column label="Banner" width="120">
        <template #default="{ row }">
          <el-image
            v-if="getImageUrl(row?.bannerImage)"
            :src="getImageUrl(row?.bannerImage)"
            style="width: 88px; height: 32px; border-radius: 4px;"
            fit="cover"
            :preview-src-list="[getImageUrl(row?.bannerImage)]"
            preview-teleported
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="Slogan" min-width="220">
        <template #default="{ row }">
          <div style="white-space: pre-wrap; word-break: break-word; line-height: 1.4; padding: 6px 0;">
            {{ row?.slogan || '-' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="roles" label="角色" :formatter="roleFormatter" />
      <el-table-column prop="appCount" label="App数" width="90" />
      <el-table-column prop="totalDownloads" label="总下载" width="120" />
      <el-table-column label="操作" width="340" fixed="right" >
        <template #default="{ row }">
          <el-switch
            :model-value="(row?.isActive ?? 0) === 1"
            :loading="activeLoadingIds.has(Number(row?.id))"
            @change="(val: any) => handleToggleActive(row, val)"
            style="margin-right: 10px;"
          />
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="primary" link @click="openDesignerConfig(row)">查看默认配置</el-button>
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

    <!-- 设计师默认配置对话框 -->
    <el-dialog v-model="configDialogVisible" title="设计师默认配置" width="560px">
      <div v-if="configLoading" style="padding: 12px;">加载中...</div>
      <el-descriptions v-else :column="2" border size="small">
        <el-descriptions-item label="用户ID">{{ currentConfig?.userId ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="启用">{{ currentConfig?.isActive === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="默认支付">{{ currentConfig?.defaultPaymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="自动发布">{{ currentConfig?.enableAutoPublish === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="默认价格">{{ currentConfig?.defaultPrice ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="默认币种">{{ currentConfig?.defaultCurrency || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述模板" :span="2"><div style="white-space: pre-wrap;">{{ currentConfig?.descriptionTemplate || '-' }}</div></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentConfig?.createdAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentConfig?.updatedAt || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="configDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 商家资料编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑商家资料" width="720px">
      <div v-if="editLoading" style="padding: 12px;">加载中...</div>
      <el-form
        v-else
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="110px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="昵称" />
        </el-form-item>

        <el-form-item label="Banner" prop="bannerImageId">
          <ImageUpload
            v-model="editForm.bannerImageId"
            :preview-url="bannerPreviewUrl"
            aspect-code="banner"
            :max-size-mb="4"
            @uploaded="handleBannerUploaded"
          />
        </el-form-item>

        <el-form-item label="Slogan" prop="slogan">
          <el-input v-model="editForm.slogan" placeholder="Slogan" />
        </el-form-item>

        <el-form-item label="支付方式" prop="payoutMethod">
          <el-input v-model="editForm.payoutMethod" placeholder="例如: PayPal / Bank" />
        </el-form-item>
        <el-form-item label="支付账户" prop="payoutAccount">
          <el-input v-model="editForm.payoutAccount" placeholder="账户信息" />
        </el-form-item>

        <el-form-item label="Facebook" prop="facebookUrl">
          <el-input v-model="editForm.facebookUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="Instagram" prop="instagramUrl">
          <el-input v-model="editForm.instagramUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="X" prop="xUrl">
          <el-input v-model="editForm.xUrl" placeholder="https://..." />
        </el-form-item>

        <el-form-item label="App数" prop="appCount">
          <el-input-number v-model="editForm.appCount" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item label="总下载" prop="totalDownloads">
          <el-input-number v-model="editForm.totalDownloads" :min="0" :max="999999999" controls-position="right" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getMerchantById, pageMerchantUsers, setMerchantActive, type MerchantUserPageQueryDTO, updateMerchantById } from '@/api/user'
import type { ImageVO } from '@/types/image'
import type { MchUserVO, UserMchUpdateDTO } from '@/types/user'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { getDesignerDefaultConfigByUser } from '@/api/designer-default-config'
import type { DesignerDefaultConfigVO } from '@/types/designer-default-config'
import UserSelect from '@/components/users/UserSelect.vue'

const users = ref<MchUserVO[]>([])
const loading = ref(false)
const total = ref(0)

const query = ref<MerchantUserPageQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  orderBy: 'id desc',
  userId: undefined,
  username: undefined,
  email: undefined,
})

const searchUserId = ref<number | undefined>(undefined)

const handleUserChange = (val?: number) => {
  query.value.userId = val
  query.value.pageNum = 1
  fetchUsers()
}

const roleFormatter = (row: any) => {
  if (Array.isArray(row.roles)) {
    if (row.roles.length > 0 && typeof row.roles[0] === 'object') {
      return row.roles.map((r: any) => r.roleName).join(', ')
    }
    return row.roles.join(', ')
  }
  return ''
}

const activeLoadingIds = ref(new Set<number>())

const handleToggleActive = async (row: MchUserVO, val: boolean) => {
  const id = Number((row as any)?.id)
  if (!id) return

  const next = val ? 1 : 0
  const prev = (row as any)?.isActive

  ;(row as any).isActive = next
  activeLoadingIds.value.add(id)
  try {
    const res = await setMerchantActive(id, next)
    if (res.code === 0) {
      ElMessage.success('更新成功')
      fetchUsers()
    } else {
      ;(row as any).isActive = prev
      ElMessage.error(res.msg || '更新失败')
    }
  } catch {
    ;(row as any).isActive = prev
    ElMessage.error('更新失败')
  } finally {
    activeLoadingIds.value.delete(id)
  }
}

// 编辑商家资料
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editSaving = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = ref({
  id: 0,
  username: '',
  nickname: '',
  status: 1,
  payoutMethod: '',
  payoutAccount: '',
  bannerImageId: undefined as number | undefined,
  slogan: '',
  facebookUrl: '',
  instagramUrl: '',
  xUrl: '',
  appCount: 0,
  totalDownloads: 0,
})

const bannerPreviewUrl = ref('')

watch(
  () => editForm.value.bannerImageId,
  (v) => {
    if (v === undefined) bannerPreviewUrl.value = ''
  }
)

const getImageUrl = (img?: any): string => {
  if (!img) return ''
  return img.url || img.previewUrl || img.formats?.thumbnail?.url || ''
}

const handleBannerUploaded = (img: ImageVO) => {
  bannerPreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

const editRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
}

const openEdit = async (row: any) => {
  if (!row?.id) return
  editDialogVisible.value = true
  editLoading.value = true
  try {
    const res = await getMerchantById(Number(row.id))
    const r = (res as any)?.data as MchUserVO | undefined
    if (!r) {
      ElMessage.error('未获取到商家信息')
      return
    }
    editForm.value = {
      id: Number(r.id),
      username: r.username || '',
      nickname: (r.nickname || '') as any,
      status: (r.status ?? 1) as any,
      payoutMethod: (r.payoutMethod || '') as any,
      payoutAccount: (r.payoutAccount || '') as any,
      bannerImageId: (r.bannerImageId ?? undefined) as any,
      slogan: (r.slogan || '') as any,
      facebookUrl: (r.facebookUrl || '') as any,
      instagramUrl: (r.instagramUrl || '') as any,
      xUrl: (r.xUrl || '') as any,
      appCount: (r.appCount ?? 0) as any,
      totalDownloads: (r.totalDownloads ?? 0) as any,
    }
    bannerPreviewUrl.value = getImageUrl((r as any)?.bannerImage)
  } catch {
    ElMessage.error('获取商家详情失败')
  } finally {
    editLoading.value = false
  }
}

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    editSaving.value = true
    try {
      const dto: UserMchUpdateDTO = {
        username: editForm.value.username,
        nickname: editForm.value.nickname,
        status: editForm.value.status,
        payoutMethod: editForm.value.payoutMethod,
        payoutAccount: editForm.value.payoutAccount,
        bannerImageId: editForm.value.bannerImageId,
        slogan: editForm.value.slogan,
        facebookUrl: editForm.value.facebookUrl,
        instagramUrl: editForm.value.instagramUrl,
        xUrl: editForm.value.xUrl,
        appCount: editForm.value.appCount,
        totalDownloads: editForm.value.totalDownloads,
      }
      const res = await updateMerchantById(editForm.value.id, dto)
      if (res.code === 0) {
        ElMessage.success('保存成功')
        editDialogVisible.value = false
        fetchUsers()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch {
      ElMessage.error('保存失败')
    } finally {
      editSaving.value = false
    }
  })
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await pageMerchantUsers(query.value)
    if (res.code === 0 && res.data) {
      users.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取商家用户失败')
    }
  } catch (e) {
    ElMessage.error('获取商家用户失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchUsers()
}

const handleReset = () => {
  searchUserId.value = undefined
  query.value = { pageNum: 1, pageSize: query.value.pageSize, orderBy: 'id desc', userId: undefined, username: undefined, email: undefined }
  fetchUsers()
}

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchUsers()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchUsers()
}

// 查看设计师默认配置
const configDialogVisible = ref(false)
const configLoading = ref(false)
const currentConfig = ref<DesignerDefaultConfigVO | null>(null)

const openDesignerConfig = async (row: any) => {
  if (!row?.id) return
  configDialogVisible.value = true
  configLoading.value = true
  currentConfig.value = null
  try {
    const res = await getDesignerDefaultConfigByUser(Number(row.id))
    if (res.code === 0) {
      currentConfig.value = res.data || null
      if (!currentConfig.value) {
        ElMessage.info('未找到默认配置')
      }
    } else {
      ElMessage.error(res.msg || '获取默认配置失败')
    }
  } catch (e: any) {
    const msg = e?.msg || e?.message || ''
    if (e?.code === -1 && /not found|不存在/i.test(msg)) {
      currentConfig.value = null
      ElMessage.info('未找到默认配置')
    } else {
      ElMessage.error(msg || '获取默认配置失败')
    }
  } finally {
    configLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.merchant-page {
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

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.el-table {
  flex: 1;
  margin-bottom: 16px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
}
</style>
