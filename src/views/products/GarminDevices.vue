<template>
  <div class="page">
    <div class="header">
      <ListSearchPanel>
        <div class="list-search-field list-search-field--wide">
          <span class="list-search-label">设备名称（模糊搜索）</span>
          <el-input aria-label="设备名称（模糊搜索）"
            v-model="displayName"
            placeholder="设备名称（模糊搜索）"
            clearable
            style="width: 240px"
            @input="onNameInput"
          />
        </div>
        <div class="list-search-field">
          <span class="list-search-label">排序</span>
          <el-select aria-label="排序" v-model="orderBy" placeholder="排序" clearable style="width: 180px">
            <el-option label="创建时间倒序" value="id:desc" />
            <el-option label="创建时间正序" value="id:asc" />
          </el-select>
        </div>
        <template #query>
          <el-button type="primary" @click="loadData">查询</el-button>
        </template>
        <template #actions>
          <el-button type="primary" @click="handleAdd">新增设备</el-button>
        </template>
      </ListSearchPanel>
    </div>

    <el-table :data="list" border v-loading="loading" style="width: 100%">
      <TableActionColumn>
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </TableActionColumn>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="图片" width="80" align="center">
        <template #default="{ row }">
          <el-image v-if="row.imageUrl" :src="row.imageUrl" style="width: 48px; height: 48px" fit="contain" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="displayName" label="设备名称" min-width="180" />
      <el-table-column prop="deviceId" label="Device ID" min-width="140" />
      <el-table-column prop="partNumber" label="Part No." min-width="140" />
      <el-table-column prop="deviceFamily" label="系列" width="120" />
      <el-table-column prop="deviceGroup" label="API分组" width="120" />
      <el-table-column prop="resolutionWidth" label="分辨率" width="120">
        <template #default="{ row }">{{ row.resolutionWidth }} × {{ row.resolutionHeight }}</template>
      </el-table-column>
      <el-table-column prop="displayType" label="显示类型" width="120" />
      <el-table-column prop="enhancedGraphicSupport" label="增强图形" width="100">
        <template #default="{ row }"><el-tag :type="row.enhancedGraphicSupport ? 'success' : 'info'">{{ row.enhancedGraphicSupport ? '是' : '否' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="设备PNG" width="100">
        <template #default="{ row }">
          <el-image v-if="row.devicePng" :src="row.devicePng" style="width: 48px; height: 48px" fit="cover" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="透明PNG" width="100">
        <template #default="{ row }">
          <el-image v-if="row.deviceTransparentPng" :src="row.deviceTransparentPng" style="width: 48px; height: 48px" fit="contain" />
          <span v-else>-</span>
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
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <GarminDeviceCreateDialog
      v-model="createVisible"
      @success="onDialogSuccess"
    />
    <GarminDeviceEditDialog
      v-model="editVisible"
      :device="editingDevice"
      @success="onDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { GarminDeviceVO } from '@/types/garmin-device'
import { pageGarminDevices, deleteGarminDevice } from '@/api/garmin-device'
import GarminDeviceCreateDialog from './components/GarminDeviceCreateDialog.vue'
import GarminDeviceEditDialog from './components/GarminDeviceEditDialog.vue'

const list = ref<GarminDeviceVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const orderBy = ref<string | undefined>('id:desc')
const displayName = ref<string>('')
const searchTimer = ref<number | undefined>(undefined)
const loading = ref(false)

const createVisible = ref(false)
const editVisible = ref(false)
const editingDevice = ref<GarminDeviceVO | null>(null)
const router = useRouter()

async function loadData() {
  loading.value = true
  try {
    const resp = await pageGarminDevices({ pageNum: pageNum.value, pageSize: pageSize.value, orderBy: orderBy.value, displayName: displayName.value || undefined })
    const data: any = (resp as any)?.data
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

function onNameInput() {
  pageNum.value = 1
  if (searchTimer.value) window.clearTimeout(searchTimer.value)
  searchTimer.value = window.setTimeout(() => {
    loadData()
  }, 300)
}

function handleAdd() {
  createVisible.value = true
}

function handleEdit(row: GarminDeviceVO) {
  editingDevice.value = { ...row }
  editVisible.value = true
}

function handleDetail(row: GarminDeviceVO) {
  router.push({ name: 'GarminDeviceDetail', params: { deviceId: row.deviceId } })
}

function onDialogSuccess() {
  loadData()
}

async function handleDelete(row: GarminDeviceVO) {
  try {
    await ElMessageBox.confirm(`确认删除设备【${row.displayName}】？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteGarminDevice(Number(row.id))
    ElMessage.success('已删除')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; text-align: right; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
</style>
