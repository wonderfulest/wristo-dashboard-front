<template>
  <el-dialog
    :model-value="modelValue"
    title="新增配置"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="App">
        <AppSearchSelect v-model="form.appId" />
      </el-form-item>

      <el-form-item label="启用">
        <el-switch v-model="enabledSwitch" />
      </el-form-item>

      <el-form-item label="选图模式">
        <el-select v-model="form.selectionMode" placeholder="请选择模式" style="width: 240px;">
          <el-option label="按权重随机" value="weighted_random" />
          <el-option label="固定图" value="fixed" />
          <el-option label="顺序轮播" value="sequential" />
        </el-select>
      </el-form-item>

      <el-form-item label="固定图片">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap: wrap;">
          <el-image
            v-if="fixedImagePreview"
            :src="fixedImagePreview"
            style="width:48px;height:48px;border-radius:6px;"
            fit="cover"
          />
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            :on-change="onFixedImageChange"
          >
            <el-button size="small">上传图片</el-button>
          </el-upload>
          <el-button v-if="form.fixedImageId" size="small" text type="danger" @click="clearFixedImage">清除</el-button>
          <div style="color:#909399; font-size:12px;">仅在“固定图”模式下生效</div>
        </div>
      </el-form-item>

      <el-form-item label="不重复天数">
        <el-input-number v-model="form.noRepeatDays" :min="0" />
      </el-form-item>

      <el-form-item label="刷新时间">
        <el-time-picker
          v-model="refreshTime"
          placeholder="选择刷新时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="每日最多选取">
        <el-input-number v-model="form.maxDailyPick" :min="0" />
      </el-form-item>

      <el-form-item label="使用权重">
        <el-switch v-model="useWeightSwitch" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch v-model="activeSwitch" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emitClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { saveAppDailyConfig } from '@/api/app-daily'
import type { ConfigUpsertDTO } from '@/types/app-daily'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { uploadImage } from '@/api/image'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'success'): void }>()

const submitting = ref(false)

const form = ref<ConfigUpsertDTO>({
  appId: undefined as unknown as number,
  isEnabled: 1,
  selectionMode: 'weighted_random',
  fixedImageId: null,
  noRepeatDays: 7,
  refreshTime: '00:00:00',
  maxDailyPick: 1,
  useWeight: 1,
  remark: '',
  isActive: 1,
})

const enabledSwitch = computed({
  get: () => form.value.isEnabled === 1,
  set: v => (form.value.isEnabled = v ? 1 : 0),
})
const useWeightSwitch = computed({
  get: () => form.value.useWeight === 1,
  set: v => (form.value.useWeight = v ? 1 : 0),
})
const activeSwitch = computed({
  get: () => form.value.isActive === 1,
  set: v => (form.value.isActive = v ? 1 : 0),
})

const refreshTime = ref<string | null>(form.value.refreshTime || '00:00:00')
watch(refreshTime, v => (form.value.refreshTime = v || null))

// App 搜索选择由 AppSearchSelect 组件封装

const reset = () => {
  form.value = {
    appId: undefined as unknown as number,
    isEnabled: 1,
    selectionMode: 'weighted_random',
    fixedImageId: null,
    noRepeatDays: 7,
    refreshTime: '00:00:00',
    maxDailyPick: 1,
    useWeight: 1,
    remark: '',
    isActive: 1,
  }
  refreshTime.value = form.value.refreshTime || '00:00:00'
}

const emitClose = () => emit('update:modelValue', false)
const handleClose = () => {
  emitClose()
}

// 当对话框打开时，确保时间选择器显示默认值
watch(() => props.modelValue, (open) => {
  if (open) {
    refreshTime.value = form.value.refreshTime || '00:00:00'
  }
})

// 固定图片上传预览与设置
const fixedImagePreview = ref<string>('')
const onFixedImageChange = async (uploadFile: any) => {
  const raw: File | null = uploadFile?.raw || null
  if (!raw) return
  try {
    const res = await uploadImage(raw)
    if (res.code === 0 && res.data) {
      form.value.fixedImageId = res.data.id as unknown as number
      fixedImagePreview.value = res.data.previewUrl || (res.data as any)?.formats?.thumbnail?.url || res.data.url || ''
      ElMessage.success('图片已上传')
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (e) {
    // 错误提示在拦截器
  }
}

const clearFixedImage = () => {
  form.value.fixedImageId = null as unknown as number
  fixedImagePreview.value = ''
}

const handleSubmit = async () => {
  if (!form.value.appId) {
    ElMessage.warning('请填写 AppID')
    return
  }
  try {
    submitting.value = true
    const res = await saveAppDailyConfig(form.value)
    if (res.code === 0) {
      ElMessage.success('新增成功')
      emit('success')
      reset()
      emitClose()
    } else {
      ElMessage.error(res.msg || '新增失败')
    }
  } catch (e) {
    // 错误提示在拦截器
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.dialog-footer { display: inline-flex; gap: 12px; }
</style>
