<template>
  <div class="email-preferences-page">
    <div class="page-header">
      <h2>用户隐私（邮件偏好）</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input v-model="searchEmail" placeholder="按邮箱搜索" clearable style="width: 280px" @keyup.enter.native="handleSearch" />
        <el-input v-model="updatedBy" placeholder="操作人（updatedBy，可选）" clearable style="width: 220px" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-table :data="records" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="email" label="Email" min-width="220" />
      <el-table-column label="全局退订" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isUnsubscribed === 1 ? 'danger' : 'success'">
            {{ row.isUnsubscribed === 1 ? '已退订' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="系统类" min-width="220">
        <template #default="{ row }">
          <div class="flags">
            <el-tag size="small" :type="row.systemNotifications === 1 ? 'success' : 'info'">系统通知</el-tag>
            <el-tag size="small" :type="row.purchaseReceipts === 1 ? 'success' : 'info'">购买收据</el-tag>
            <el-tag size="small" :type="row.licenseUpdates === 1 ? 'success' : 'info'">授权更新</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="营销类" min-width="300">
        <template #default="{ row }">
          <div class="flags">
            <el-tag size="small" :type="row.weeklyNewsletter === 1 ? 'success' : 'info'">周报</el-tag>
            <el-tag size="small" :type="row.exclusivePromotions === 1 ? 'success' : 'info'">专属优惠</el-tag>
            <el-tag size="small" :type="row.bundleOffers === 1 ? 'success' : 'info'">套餐优惠</el-tag>
            <el-tag size="small" :type="row.creatorSpotlight === 1 ? 'success' : 'info'">创作者推荐</el-tag>
            <el-tag size="small" :type="row.personalizedRecommendations === 1 ? 'success' : 'info'">个性化推荐</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="社区与教育" min-width="220">
        <template #default="{ row }">
          <div class="flags">
            <el-tag size="small" :type="row.designUpdates === 1 ? 'success' : 'info'">设计更新</el-tag>
            <el-tag size="small" :type="row.platformAnnouncements === 1 ? 'success' : 'info'">平台公告</el-tag>
            <el-tag size="small" :type="row.surveysFeedback === 1 ? 'success' : 'info'">问卷反馈</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="lastUpdatedBy" label="最后更新人" width="140" />
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" width="220">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="confirmDelete(row)">删除</el-button>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link" style="cursor: pointer; color: var(--el-color-primary);">更多</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="confirmUnsubscribeAll(row)">全部退订</el-dropdown-item>
                <el-dropdown-item @click="confirmSubscribeAll(row)">全部订阅</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户隐私' : '新建用户隐私'" width="860px">
      <el-form ref="formRef" :model="form" label-width="160px">
        <el-form-item label="Email" required>
          <el-input v-model="form.email" placeholder="请输入邮箱" :disabled="isEdit" />
        </el-form-item>

        <el-divider content-position="left">系统类（建议必开）</el-divider>
        <el-form-item label="系统通知">
          <el-switch v-model="boolForm.systemNotifications" />
        </el-form-item>
        <el-form-item label="购买收据">
          <el-switch v-model="boolForm.purchaseReceipts" />
        </el-form-item>
        <el-form-item label="授权更新">
          <el-switch v-model="boolForm.licenseUpdates" />
        </el-form-item>

        <el-divider content-position="left">营销类</el-divider>
        <el-form-item label="周报">
          <el-switch v-model="boolForm.weeklyNewsletter" />
        </el-form-item>
        <el-form-item label="专属优惠">
          <el-switch v-model="boolForm.exclusivePromotions" />
        </el-form-item>
        <el-form-item label="套餐优惠">
          <el-switch v-model="boolForm.bundleOffers" />
        </el-form-item>
        <el-form-item label="创作者推荐">
          <el-switch v-model="boolForm.creatorSpotlight" />
        </el-form-item>
        <el-form-item label="个性化推荐">
          <el-switch v-model="boolForm.personalizedRecommendations" />
        </el-form-item>

        <el-divider content-position="left">社区与教育</el-divider>
        <el-form-item label="设计更新">
          <el-switch v-model="boolForm.designUpdates" />
        </el-form-item>
        <el-form-item label="平台公告">
          <el-switch v-model="boolForm.platformAnnouncements" />
        </el-form-item>
        <el-form-item label="问卷反馈">
          <el-switch v-model="boolForm.surveysFeedback" />
        </el-form-item>

        <el-divider content-position="left">通用</el-divider>
        <el-form-item label="全部退订">
          <el-switch v-model="boolForm.isUnsubscribed" />
        </el-form-item>
        <el-form-item label="最后更新人">
          <el-input v-model="form.lastUpdatedBy" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import type { EmailPreferencesVO, EmailPreferencesCreateDTO, EmailPreferencesUpdateDTO } from '@/types/contact'
import {
  createEmailPreferences,
  deleteEmailPreferencesById,
  pageEmailPreferences,
  subscribeAllByEmail,
  unsubscribeAllByEmail,
  updateEmailPreferencesById
} from '@/api/email-preferences'

const loading = ref(false)
const records = ref<EmailPreferencesVO[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchEmail = ref('')
const updatedBy = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<EmailPreferencesCreateDTO & EmailPreferencesUpdateDTO>({
  email: '',
  systemNotifications: 1,
  purchaseReceipts: 1,
  licenseUpdates: 1,
  weeklyNewsletter: 1,
  exclusivePromotions: 1,
  bundleOffers: 1,
  creatorSpotlight: 1,
  personalizedRecommendations: 1,
  designUpdates: 0,
  platformAnnouncements: 1,
  surveysFeedback: 0,
  isUnsubscribed: 0,
  lastUpdatedBy: ''
})

const boolForm = reactive({
  systemNotifications: true,
  purchaseReceipts: true,
  licenseUpdates: true,
  weeklyNewsletter: true,
  exclusivePromotions: true,
  bundleOffers: true,
  creatorSpotlight: true,
  personalizedRecommendations: true,
  designUpdates: false,
  platformAnnouncements: true,
  surveysFeedback: false,
  isUnsubscribed: false
})

const syncBoolFromInt = (row?: Partial<EmailPreferencesVO>) => {
  const v = row || form
  boolForm.systemNotifications = (v.systemNotifications ?? 0) === 1
  boolForm.purchaseReceipts = (v.purchaseReceipts ?? 0) === 1
  boolForm.licenseUpdates = (v.licenseUpdates ?? 0) === 1
  boolForm.weeklyNewsletter = (v.weeklyNewsletter ?? 0) === 1
  boolForm.exclusivePromotions = (v.exclusivePromotions ?? 0) === 1
  boolForm.bundleOffers = (v.bundleOffers ?? 0) === 1
  boolForm.creatorSpotlight = (v.creatorSpotlight ?? 0) === 1
  boolForm.personalizedRecommendations = (v.personalizedRecommendations ?? 0) === 1
  boolForm.designUpdates = (v.designUpdates ?? 0) === 1
  boolForm.platformAnnouncements = (v.platformAnnouncements ?? 0) === 1
  boolForm.surveysFeedback = (v.surveysFeedback ?? 0) === 1
  boolForm.isUnsubscribed = (v.isUnsubscribed ?? 0) === 1
}

const syncIntFromBool = () => {
  form.systemNotifications = boolForm.systemNotifications ? 1 : 0
  form.purchaseReceipts = boolForm.purchaseReceipts ? 1 : 0
  form.licenseUpdates = boolForm.licenseUpdates ? 1 : 0
  form.weeklyNewsletter = boolForm.weeklyNewsletter ? 1 : 0
  form.exclusivePromotions = boolForm.exclusivePromotions ? 1 : 0
  form.bundleOffers = boolForm.bundleOffers ? 1 : 0
  form.creatorSpotlight = boolForm.creatorSpotlight ? 1 : 0
  form.personalizedRecommendations = boolForm.personalizedRecommendations ? 1 : 0
  form.designUpdates = boolForm.designUpdates ? 1 : 0
  form.platformAnnouncements = boolForm.platformAnnouncements ? 1 : 0
  form.surveysFeedback = boolForm.surveysFeedback ? 1 : 0
  form.isUnsubscribed = boolForm.isUnsubscribed ? 1 : 0
}

watch(
  () => ({ ...boolForm }),
  () => {
    syncIntFromBool()
  },
  { deep: true }
)

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageEmailPreferences({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: 'updated_at desc',
      email: searchEmail.value?.trim() || undefined
    })
    if (res.code === 0 && res.data) {
      records.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取用户隐私列表失败')
    }
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  searchEmail.value = ''
  pageNum.value = 1
  fetchPage()
}

const resetForm = () => {
  delete (form as any).id
  form.email = ''
  form.systemNotifications = 1
  form.purchaseReceipts = 1
  form.licenseUpdates = 1
  form.weeklyNewsletter = 1
  form.exclusivePromotions = 1
  form.bundleOffers = 1
  form.creatorSpotlight = 1
  form.personalizedRecommendations = 1
  form.designUpdates = 0
  form.platformAnnouncements = 1
  form.surveysFeedback = 0
  form.isUnsubscribed = 0
  form.lastUpdatedBy = ''
  syncBoolFromInt()
}

const openCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row: EmailPreferencesVO) => {
  isEdit.value = true
  resetForm()
  ;(form as any).id = row.id
  form.email = row.email
  form.systemNotifications = row.systemNotifications ?? form.systemNotifications
  form.purchaseReceipts = row.purchaseReceipts ?? form.purchaseReceipts
  form.licenseUpdates = row.licenseUpdates ?? form.licenseUpdates
  form.weeklyNewsletter = row.weeklyNewsletter ?? form.weeklyNewsletter
  form.exclusivePromotions = row.exclusivePromotions ?? form.exclusivePromotions
  form.bundleOffers = row.bundleOffers ?? form.bundleOffers
  form.creatorSpotlight = row.creatorSpotlight ?? form.creatorSpotlight
  form.personalizedRecommendations = row.personalizedRecommendations ?? form.personalizedRecommendations
  form.designUpdates = row.designUpdates ?? form.designUpdates
  form.platformAnnouncements = row.platformAnnouncements ?? form.platformAnnouncements
  form.surveysFeedback = row.surveysFeedback ?? form.surveysFeedback
  form.isUnsubscribed = row.isUnsubscribed ?? form.isUnsubscribed
  form.lastUpdatedBy = row.lastUpdatedBy || ''
  syncBoolFromInt(row)
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.email || !form.email.includes('@')) {
    ElMessage.error('请输入正确的邮箱')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      const id = Number((form as any).id)
      await updateEmailPreferencesById(id, { ...form } as EmailPreferencesUpdateDTO)
      ElMessage.success('更新成功')
    } else {
      const { id: _id, ...rest } = form as any
      await createEmailPreferences(rest as EmailPreferencesCreateDTO)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (row: EmailPreferencesVO) => {
  try {
    await ElMessageBox.confirm(`确认删除 ${row.email} 的隐私配置吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteEmailPreferencesById(row.id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '删除失败')
  }
}

const confirmUnsubscribeAll = async (row: EmailPreferencesVO) => {
  try {
    await ElMessageBox.confirm(`确认将 ${row.email} 全部退订吗？`, '全部退订', { type: 'warning' })
  } catch {
    return
  }
  try {
    await unsubscribeAllByEmail(row.email, updatedBy.value?.trim() || undefined)
    ElMessage.success('已全部退订')
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '操作失败')
  }
}

const confirmSubscribeAll = async (row: EmailPreferencesVO) => {
  try {
    await ElMessageBox.confirm(`确认将 ${row.email} 全部订阅吗？`, '全部订阅', { type: 'warning' })
  } catch {
    return
  }
  try {
    await subscribeAllByEmail(row.email, updatedBy.value?.trim() || undefined)
    ElMessage.success('已全部订阅')
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '操作失败')
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.email-preferences-page {
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
