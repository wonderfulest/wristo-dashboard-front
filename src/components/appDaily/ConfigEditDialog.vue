<template>
  <el-dialog :model-value="modelValue" title="编辑配置" width="640px" @close="emitClose">
    <template v-if="loaded">
      <el-form :model="form" label-width="120px">
        <el-form-item label="应用">
          <div style="display:flex; flex-direction:column; align-items:flex-start; gap:4px;">
            <span>{{ productName || '-' }}</span>
            <span style="color:#909399; font-size:12px;">AppID：{{ form.appId }}</span>
          </div>
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
            <el-image v-if="fixedImagePreview" :src="fixedImagePreview" style="width:48px;height:48px;border-radius:6px;" fit="cover" />
            <el-upload :show-file-list="false" :auto-upload="false" :on-change="onFixedImageChange">
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
          <el-time-picker v-model="refreshTime" placeholder="选择刷新时间" format="HH:mm:ss" value-format="HH:mm:ss" />
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
    </template>
    <template v-else>
      <div style="padding: 20px; text-align:center; color:#909399;">加载中...</div>
    </template>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emitClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAppDailyConfigDetail, updateAppDailyConfig } from '@/api/app-daily'
import type { ConfigUpsertDTO, AppDailyImageConfig } from '@/types/app-daily'
import { uploadImage } from '@/api/image'

const props = defineProps<{ modelValue: boolean; appId?: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'success'): void }>()

const submitting = ref(false)
const loaded = ref(false)
const currentId = ref<number | null>(null)
const productName = ref<string>('')

const form = ref<ConfigUpsertDTO>({
  appId: 0,
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

const enabledSwitch = computed({ get: () => form.value.isEnabled === 1, set: v => (form.value.isEnabled = v ? 1 : 0) })
const useWeightSwitch = computed({ get: () => form.value.useWeight === 1, set: v => (form.value.useWeight = v ? 1 : 0) })
const activeSwitch = computed({ get: () => form.value.isActive === 1, set: v => (form.value.isActive = v ? 1 : 0) })

const refreshTime = ref<string | null>(form.value.refreshTime || '00:00:00')
watch(refreshTime, v => (form.value.refreshTime = v || null))

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
  } catch {}
}
const clearFixedImage = () => {
  form.value.fixedImageId = null as unknown as number
  fixedImagePreview.value = ''
}

const emitClose = () => emit('update:modelValue', false)

const loadDetail = async (appId: number) => {
  loaded.value = false
  try {
    const res = await getAppDailyConfigDetail(appId)
    if (res.code === 0 && res.data) {
      const d = res.data as unknown as AppDailyImageConfig
      currentId.value = d.id
      form.value = {
        appId: d.appId,
        isEnabled: d.isEnabled,
        selectionMode: d.selectionMode,
        fixedImageId: d.fixedImageId,
        noRepeatDays: d.noRepeatDays,
        refreshTime: d.refreshTime,
        maxDailyPick: d.maxDailyPick,
        useWeight: d.useWeight ?? 1,
        remark: d.remark ?? '',
        isActive: d.isActive,
      }
      refreshTime.value = form.value.refreshTime || '00:00:00'
      // populate: product name & image (support both 'image' and 'fixedImage')
      productName.value = (res.data as any)?.product?.name || ''
      const img: any = (res.data as any).image || (res.data as any).fixedImage
      fixedImagePreview.value = img ? (img.previewUrl || img?.formats?.thumbnail?.url || img.url || '') : ''
      loaded.value = true
    } else {
      ElMessage.error(res.msg || '加载配置失败')
    }
  } catch {
    // errors handled globally
  } finally {
    loaded.value = true
  }
}

watch(() => props.modelValue, (open) => {
  if (open && props.appId) {
    loadDetail(props.appId)
  }
})

const handleSubmit = async () => {
  if (!currentId.value) return
  try {
    submitting.value = true
    const res = await updateAppDailyConfig(currentId.value, form.value)
    if (res.code === 0) {
      ElMessage.success('更新成功')
      emit('success')
      emitClose()
    } else {
      ElMessage.error(res.msg || '更新失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>
