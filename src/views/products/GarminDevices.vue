<template>
  <div class="page">
    <div class="header">
      <div class="filters">
        <el-input v-model="keyword" placeholder="关键字 (ID/名称/系列)" clearable style="width: 240px" @keyup.enter="loadData" />
        <el-select v-model="orderBy" placeholder="排序" clearable style="width: 180px">
          <el-option label="创建时间倒序" value="id:desc" />
          <el-option label="创建时间正序" value="id:asc" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button type="primary" @click="handleAdd">新增设备</el-button>
      </div>
    </div>

    <el-table :data="list" border v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="displayName" label="设备名称" min-width="180" />
      <el-table-column prop="deviceId" label="Device ID" min-width="140" />
      <el-table-column prop="partNumber" label="Part No." min-width="140" />
      <el-table-column prop="deviceFamily" label="系列" width="120" />
      <el-table-column prop="deviceGroup" label="分组" width="120" />
      <el-table-column prop="deviceVersion" label="版本" width="100" />
      <el-table-column prop="resolutionWidth" label="分辨率" width="120">
        <template #default="{ row }">{{ row.resolutionWidth }} × {{ row.resolutionHeight }}</template>
      </el-table-column>
      <el-table-column prop="displayType" label="显示类型" width="120" />
      <el-table-column prop="enhancedGraphicSupport" label="增强图形" width="100">
        <template #default="{ row }"><el-tag :type="row.enhancedGraphicSupport ? 'success' : 'info'">{{ row.enhancedGraphicSupport ? '是' : '否' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增设备' : '编辑设备'" width="720px">
      <el-form ref="formRef" :model="form" label-width="140px">
        <div class="form-grid">
          <el-form-item label="设备名称" prop="displayName"><el-input v-model="form.displayName" /></el-form-item>
          <el-form-item label="Device ID" prop="deviceId"><el-input v-model="form.deviceId" /></el-form-item>
          <el-form-item label="Part Number" prop="partNumber"><el-input v-model="form.partNumber" /></el-form-item>
          <el-form-item label="系列 (Family)" prop="deviceFamily"><el-input v-model="form.deviceFamily" /></el-form-item>
          <el-form-item label="分组 (Group)" prop="deviceGroup"><el-input v-model="form.deviceGroup" /></el-form-item>
          <el-form-item label="版本 (Version)" prop="deviceVersion"><el-input v-model="form.deviceVersion" /></el-form-item>
          <el-form-item label="显示类型" prop="displayType"><el-input v-model="form.displayType" /></el-form-item>
          <el-form-item label="像素格式" prop="pixelFormat"><el-input v-model="form.pixelFormat" /></el-form-item>
          <el-form-item label="分辨率(宽)" prop="resolutionWidth"><el-input-number v-model="form.resolutionWidth" :min="0" /></el-form-item>
          <el-form-item label="分辨率(高)" prop="resolutionHeight"><el-input-number v-model="form.resolutionHeight" :min="0" /></el-form-item>
          <el-form-item label="增强图形支持" prop="enhancedGraphicSupport"><el-switch v-model="form.enhancedGraphicSupport" /></el-form-item>
          <el-form-item label="旋转支持" prop="screenRotationSupport"><el-switch v-model="form.screenRotationSupport" /></el-form-item>
          <el-form-item label="硬件 Part No." prop="hardwarePartNumber"><el-input v-model="form.hardwarePartNumber" /></el-form-item>
          <el-form-item label="设备图片 URL" prop="imageUrl"><el-input v-model="form.imageUrl" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { GarminDeviceVO, GarminDeviceCreateDTO, GarminDeviceUpdateDTO } from '@/types/garmin-device'
import { pageGarminDevices, createGarminDevice, updateGarminDevice, deleteGarminDevice } from '@/api/garmin-device'

const list = ref<GarminDeviceVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const orderBy = ref<string | undefined>('id:desc')
const keyword = ref<string>('')
const loading = ref(false)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()
const form = ref<Partial<GarminDeviceVO>>({
  displayName: '',
  deviceId: '',
  partNumber: '',
  deviceFamily: '',
  deviceGroup: '',
  deviceVersion: '',
  displayType: '',
  enhancedGraphicSupport: false,
  hardwarePartNumber: '',
  imageUrl: '',
  pixelFormat: '',
  resolutionHeight: 0,
  resolutionWidth: 0,
  screenRotationSupport: false,
})

async function loadData() {
  loading.value = true
  try {
    const resp = await pageGarminDevices({ pageNum: pageNum.value, pageSize: pageSize.value, orderBy: orderBy.value, keyword: keyword.value || undefined })
    const data: any = (resp as any)?.data
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogType.value = 'add'
  form.value = {
    displayName: '',
    deviceId: '',
    partNumber: '',
    deviceFamily: '',
    deviceGroup: '',
    deviceVersion: '',
    displayType: '',
    enhancedGraphicSupport: false,
    hardwarePartNumber: '',
    imageUrl: '',
    pixelFormat: '',
    resolutionHeight: 0,
    resolutionWidth: 0,
    screenRotationSupport: false,
  }
  dialogVisible.value = true
}

function handleEdit(row: GarminDeviceVO) {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (dialogType.value === 'add') {
      const payload: GarminDeviceCreateDTO = { ...form.value } as any
      await createGarminDevice(payload)
      ElMessage.success('创建成功')
    } else {
      await updateGarminDevice(Number(form.value.id), form.value as GarminDeviceUpdateDTO)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
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
