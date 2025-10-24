<template>
  <el-dialog v-model="visibleInner" title="编辑设备" width="720px" :close-on-click-modal="false">
    <el-form :model="form" label-width="140px">
      <div class="form-grid">
        <el-form-item label="Device ID"><el-input v-model="form.deviceId" disabled /></el-form-item>
        <el-form-item label="设备名称"><el-input :model-value="device?.displayName" disabled /></el-form-item>
        <el-form-item label="Part Number"><el-input :model-value="device?.partNumber" disabled /></el-form-item>
        <el-form-item label="系列 (Family)"><el-input :model-value="device?.deviceFamily" disabled /></el-form-item>
        <el-form-item label="API分组"><el-input :model-value="device?.deviceGroup" disabled /></el-form-item>
        <el-form-item label="显示类型"><el-input :model-value="device?.displayType" disabled /></el-form-item>

        <el-form-item label="分辨率(宽)"><el-input-number :model-value="device?.resolutionWidth" disabled /></el-form-item>
        <el-form-item label="分辨率(高)"><el-input-number :model-value="device?.resolutionHeight" disabled /></el-form-item>

        <el-form-item label="增强图形支持"><el-switch :model-value="device?.enhancedGraphicSupport" disabled /></el-form-item>
        <el-form-item label="旋转支持"><el-switch :model-value="device?.screenRotationSupport" disabled /></el-form-item>

        <el-form-item label="设备 PNG 图片" class="full">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".png,image/png"
            :on-change="onPngFileChange"
          >
            <el-button>选择 PNG 文件</el-button>
            <template #tip>
              <div class="el-upload__tip">可选，替换设备 PNG 图片</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="Simulator JSON" class="full">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".json,application/json"
            :on-change="onSimulatorFileChange"
          >
            <el-button type="primary">选择新的 Simulator 配置</el-button>
            <template #tip>
              <div class="el-upload__tip">可选，如选择将更新 simulator</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="Compiler JSON" class="full">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".json,application/json"
            :on-change="onCompilerFileChange"
          >
            <el-button type="primary">选择新的 Compiler 配置</el-button>
            <template #tip>
              <div class="el-upload__tip">可选，如选择将更新 compiler</div>
            </template>
          </el-upload>
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updateGarminDeviceForm } from '@/api/garmin-device'
import type { GarminDeviceVO } from '@/types/garmin-device'

const props = defineProps<{
  modelValue: boolean
  device?: GarminDeviceVO | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const visibleInner = ref(false)
watch(
  () => props.modelValue,
  v => (visibleInner.value = v),
  { immediate: true }
)
watch(visibleInner, v => emit('update:modelValue', v))

// form must be defined before watchers that use it
const saving = ref(false)
const form = ref<{ deviceId: string; simulatorFile?: File; compilerFile?: File; devicePngFile?: File }>({ deviceId: '' })

const device = ref<GarminDeviceVO | null>(null)
watch(
  () => props.device,
  v => {
    device.value = v || null
    form.value.deviceId = v?.deviceId || ''
  },
  { immediate: true }
)


function close() {
  visibleInner.value = false
}

function onSimulatorFileChange(file: any) {
  const raw: File | undefined = file?.raw
  if (!raw) return
  if (!raw.name.toLowerCase().endsWith('.json')) {
    ElMessage.error('请上传 JSON 文件')
    return
  }
  form.value.simulatorFile = raw
  ElMessage.success('Simulator 文件已选择')
}

function onCompilerFileChange(file: any) {
  const raw: File | undefined = file?.raw
  if (!raw) return
  if (!raw.name.toLowerCase().endsWith('.json')) {
    ElMessage.error('请上传 JSON 文件')
    return
  }
  form.value.compilerFile = raw
  ElMessage.success('Compiler 文件已选择')
}

function onPngFileChange(file: any) {
  const raw: File | undefined = file?.raw
  if (!raw) return
  if (!raw.name.toLowerCase().endsWith('.png')) {
    ElMessage.error('请上传 PNG 文件')
    return
  }
  form.value.devicePngFile = raw
}

async function handleSave() {
  if (!device.value?.id) {
    ElMessage.error('未找到设备 ID')
    return
  }
  if (!form.value.simulatorFile && !form.value.compilerFile && !form.value.devicePngFile) {
    ElMessage.error('请至少修改一个配置或上传 PNG')
    return
  }
  saving.value = true
  try {
    await updateGarminDeviceForm({
      deviceId: form.value.deviceId,
      simulatorFile: form.value.simulatorFile,
      compilerFile: form.value.compilerFile,
      devicePngFile: form.value.devicePngFile,
    })
    ElMessage.success('更新成功')
    emit('success')
    close()
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
</style>
