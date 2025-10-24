<template>
  <el-dialog v-model="visibleInner" title="新增设备" width="720px" :close-on-click-modal="false">
    <el-form :model="form" label-width="140px">
      <div class="form-grid">
        <el-form-item label="Device ID" prop="deviceId">
          <el-input v-model="form.deviceId" />
        </el-form-item>

        <el-form-item label="Simulator JSON" class="full">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".json,application/json"
            :on-change="onSimulatorFileChange"
          >
            <el-button type="primary">选择 Simulator 配置文件</el-button>
            <template #tip>
              <div class="el-upload__tip">上传 .json 文件，内容将直接作为 simulator 上送</div>
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
            <el-button type="primary">选择 Compiler 配置文件</el-button>
            <template #tip>
              <div class="el-upload__tip">上传 .json 文件，内容将直接作为 compiler 上送</div>
            </template>
          </el-upload>
        </el-form-item>

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
              <div class="el-upload__tip">可选，作为设备图片上传</div>
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
import { createGarminDeviceForm } from '@/api/garmin-device'

const props = defineProps<{
  modelValue: boolean
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

const saving = ref(false)
const form = ref<{ deviceId: string; simulatorFile?: File; compilerFile?: File; devicePngFile?: File }>({ deviceId: '' })

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
  if (!form.value.deviceId) {
    form.value.deviceId = raw.name.replace(/\.[^.]+$/, '')
  }
}

async function handleSave() {
  if (!form.value.deviceId) {
    ElMessage.error('请填写 Device ID')
    return
  }
  if (!form.value.simulatorFile || !form.value.compilerFile) {
    ElMessage.error('请上传 Simulator 和 Compiler 配置文件')
    return
  }
  saving.value = true
  try {
    await createGarminDeviceForm({
      deviceId: form.value.deviceId,
      simulatorFile: form.value.simulatorFile,
      compilerFile: form.value.compilerFile,
      devicePngFile: form.value.devicePngFile,
    })
    ElMessage.success('创建成功')
    emit('success')
    close()
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
</style>
