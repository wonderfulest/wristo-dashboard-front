<template>
  <div class="ga-short-links-page">
    <div class="page-header">
      <h2>GA 短链配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate">新建短链</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <div class="filters">
      <el-input
        v-model="filters.keyword"
        placeholder="按名称或短链搜索"
        clearable
        style="width: 260px; margin-right: 12px;"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="filters.channel"
        clearable
        placeholder="渠道"
        style="width: 160px; margin-right: 12px;"
      >
        <el-option
          v-for="opt in channelOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select
        v-model="filters.platform"
        clearable
        placeholder="平台"
        style="width: 160px; margin-right: 12px;"
      >
        <el-option
          v-for="opt in platformOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select
        v-model="filters.status"
        clearable
        placeholder="状态"
        style="width: 160px; margin-right: 12px;"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="list" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="shortCode" label="短链编码" min-width="140" />
      <el-table-column prop="longUrl" label="目标链接" min-width="260">
        <template #default="{ row }">
          <el-link
            v-if="row.longUrl"
            :href="row.longUrl"
            target="_blank"
            type="primary"
            style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          >
            {{ row.longUrl }}
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="channel" label="渠道" width="140">
        <template #default="{ row }">
          {{ enumText(channelOptions, row.channel) }}
        </template>
      </el-table-column>
      <el-table-column prop="platform" label="平台" width="160">
        <template #default="{ row }">
          {{ enumText(platformOptions, row.platform) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ enumText(statusOptions, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalClicks" label="总点击" width="100" />
      <el-table-column prop="uniqueClicks" label="唯一点击" width="100" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">{{ row.createdAt }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleToggleStatus(row)">
            {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
          </el-button>
          <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该短链吗？" @confirm="doDelete(row)">
            <template #reference>
              <el-button size="small" type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
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

    <el-dialog v-model="formDialog.visible" :title="formDialog.isEdit ? '编辑短链' : '新建短链'" width="720px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="短链" required>
          <el-input
            v-model="form.shortCode"
            :readonly="true"
            placeholder="点击生成短链"
          >
            <template #prepend>
              <span>http://s.wristo.io/</span>
            </template>
            <template #append>
              <el-button
                v-if="!formDialog.isEdit"
                type="primary"
                :loading="generatingCode"
                @click="handleGenerateShortCode"
              >
                生成
              </el-button>
              <el-button v-else type="default" disabled>
                已生成
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="目标链接" required>
          <div style="display: flex; align-items: center; width: 100%;">
            <span
              style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              :title="form.longUrl"
            >
              {{ form.longUrl || '-' }}
            </span>
            <el-button type="primary" link style="margin-left: 8px;" @click="openUrlEditor">编辑 UTM 链接</el-button>
          </div>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="form.channel" clearable placeholder="请选择">
            <el-option
              v-for="opt in channelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="form.platform" clearable placeholder="请选择">
            <el-option
              v-for="opt in platformOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="归属活动">
          <CampaignSelect v-model="form.campaignId" placeholder="搜索活动名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" clearable placeholder="请选择">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="urlEditorDialog.visible" title="编辑完整链接" width="720px">
      <div style="margin-bottom: 8px;">
        <div style="margin-bottom: 4px; word-break: break-all;">
          当前链接：{{ urlEditorDialog.value || '(未设置)' }}
        </div>
        <el-link
          v-if="urlEditorDialog.value"
          :href="urlEditorDialog.value"
          target="_blank"
          type="primary"
        >
          在新窗口打开预览
        </el-link>
      </div>
      <UtmsUrlEditor v-model="urlEditorDialog.value" />
      <template #footer>
        <el-button @click="urlEditorDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleUrlEditorSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listEnumOptions } from '@/api/common'
import type { EnumOption } from '@/api/common'
import { GA_SHORT_LINK_STATUS_ENUM_NAME, GA_SHORT_LINK_CHANNEL_ENUM_NAME, GA_SHORT_LINK_PLATFORM_ENUM_NAME } from '@/store/common'
import { pageGaShortLinks, createGaShortLink, updateGaShortLink, deleteGaShortLink, generateGaShortCode, toggleGaShortLinkStatus, type GaShortLinkVO, type GaShortLinkCreateDTO, type GaShortLinkUpdateDTO, type GaShortLinkPageQuery } from '@/api/gaShortLink'
import UtmsUrlEditor from '@/views/ga/components/UtmsUrlEditor.vue'
import CampaignSelect from '@/views/ga/components/CampaignSelect.vue'

const loading = ref(false)
const list = ref<GaShortLinkVO[]>([])
const total = ref(0)

const query = ref<GaShortLinkPageQuery>({ pageNum: 1, pageSize: 10 })

const filters = reactive<{ keyword?: string; channel?: string; platform?: string; status?: string; campaignId?: number | null }>({})

const statusOptions = ref<Array<{ label: string; value: string }>>([])
const channelOptions = ref<Array<{ label: string; value: string }>>([])
const platformOptions = ref<Array<{ label: string; value: string }>>([])

const toOptions = (list: EnumOption[]): Array<{ label: string; value: string }> => {
  return list.map(it => {
    const anyIt = it as any
    const displayName = anyIt?.props?.displayName as string | undefined
    const label = displayName || it.description || it.name || it.value
    const value = it.name || it.value
    return { label, value }
  })
}

const loadEnums = async () => {
  try {
    const [statusResp, channelResp, platformResp] = await Promise.all([
      listEnumOptions(GA_SHORT_LINK_STATUS_ENUM_NAME) as any,
      listEnumOptions(GA_SHORT_LINK_CHANNEL_ENUM_NAME) as any,
      listEnumOptions(GA_SHORT_LINK_PLATFORM_ENUM_NAME) as any,
    ])
    const statusList: EnumOption[] = statusResp?.data?.data || statusResp?.data || []
    const channelList: EnumOption[] = channelResp?.data?.data || channelResp?.data || []
    const platformList: EnumOption[] = platformResp?.data?.data || platformResp?.data || []
    statusOptions.value = toOptions(statusList)
    channelOptions.value = toOptions(channelList)
    platformOptions.value = toOptions(platformList)
  } catch {
    statusOptions.value = []
    channelOptions.value = []
    platformOptions.value = []
  }
}

const enumText = (opts: Array<{ label: string; value: string }>, v?: string | null) => {
  if (!v) return '-'
  const found = opts.find(it => it.value === v)
  return found?.label || v
}

const fetchPage = async () => {
  loading.value = true
  try {
    const payload: GaShortLinkPageQuery = {
      pageNum: query.value.pageNum,
      pageSize: query.value.pageSize,
      campaignId: filters.campaignId ?? undefined,
      channel: filters.channel ?? undefined,
      status: filters.status ?? undefined,
      nameLike: filters.keyword ?? undefined,
      shortCodeLike: filters.keyword ?? undefined,
    }
    const res = await pageGaShortLinks(payload)
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取短链列表失败')
    }
  } catch (e) {
    ElMessage.error('获取短链列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchPage()
}

const handleReset = () => {
  const size = query.value.pageSize
  query.value = { pageNum: 1, pageSize: size }
  filters.keyword = undefined
  filters.channel = undefined
  filters.platform = undefined
  filters.status = undefined
  filters.campaignId = undefined
  fetchPage()
}

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchPage()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchPage()
}

const formDialog = reactive<{ visible: boolean; isEdit: boolean; currentId?: number | null }>({
  visible: false,
  isEdit: false,
  currentId: null,
})

const emptyForm = (): GaShortLinkCreateDTO => ({
  shortCode: '',
  longUrl: '',
  name: '',
  channel: undefined,
  platform: undefined,
  campaignId: undefined,
  status: 'ACTIVE',
})

const form = ref<GaShortLinkCreateDTO>(emptyForm())
const saving = ref(false)
const generatingCode = ref(false)

// UTM 链接编辑弹窗状态
const urlEditorDialog = reactive<{ visible: boolean; value: string }>({
  visible: false,
  value: '',
})

const openCreate = () => {
  formDialog.isEdit = false
  formDialog.currentId = null
  form.value = emptyForm()
  formDialog.visible = true
}

const openEdit = (row: GaShortLinkVO) => {
  formDialog.isEdit = true
  formDialog.currentId = row.id
  form.value = {
    shortCode: row.shortCode,
    longUrl: row.longUrl,
    name: row.name,
    channel: row.channel || undefined,
    platform: row.platform || undefined,
    campaignId: row.campaignId || undefined,
    status: row.status || undefined,
  }
  formDialog.visible = true
}

const handleGenerateShortCode = async () => {
  generatingCode.value = true
  try {
    const res = await generateGaShortCode(8)
    if (res.code === 0 && res.data) {
      ;(form.value as any).shortCode = res.data
    } else {
      ElMessage.error(res.msg || '生成短链失败')
    }
  } catch {
    ElMessage.error('生成短链失败')
  } finally {
    generatingCode.value = false
  }
}

// 打开 UTM 链接编辑弹窗
const openUrlEditor = () => {
  urlEditorDialog.value = (form.value as any).longUrl || ''
  urlEditorDialog.visible = true
}

// 从 UTM 编辑组件保存完整链接到表单
const handleUrlEditorSave = () => {
  (form.value as any).longUrl = urlEditorDialog.value
  urlEditorDialog.visible = false
}

const handleSave = async () => {
  if (!form.value.shortCode || !form.value.shortCode.trim()) {
    ElMessage.error('请填写短链编码')
    return
  }
  if (!form.value.longUrl || !form.value.longUrl.trim()) {
    ElMessage.error('请填写目标链接')
    return
  }

  saving.value = true
  try {
    if (formDialog.isEdit && formDialog.currentId) {
      // 更新时不允许修改 shortCode，仅提交其余字段
      const { shortCode, ...rest } = form.value as any
      const dto: GaShortLinkUpdateDTO = rest
      const res = await updateGaShortLink(formDialog.currentId, dto)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        formDialog.visible = false
        fetchPage()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    } else {
      const dto = form.value as GaShortLinkCreateDTO
      const res = await createGaShortLink(dto)
      if (res.code === 0) {
        ElMessage.success('创建成功')
        formDialog.visible = false
        fetchPage()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    }
  } finally {
    saving.value = false
  }
}

const doDelete = async (row: GaShortLinkVO) => {
  try {
    const res = await deleteGaShortLink(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const handleToggleStatus = async (row: GaShortLinkVO) => {
  try {
    const res = await toggleGaShortLinkStatus(row.id)
    if (res.code === 0) {
      ElMessage.success('状态已切换')
      fetchPage()
    } else {
      ElMessage.error(res.msg || '切换状态失败')
    }
  } catch (e) {
    ElMessage.error('切换状态失败')
  }
}

onMounted(async () => {
  await loadEnums()
  await fetchPage()
})
</script>

<style scoped>
.ga-short-links-page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
