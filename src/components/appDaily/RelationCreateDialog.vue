<template>
  <el-dialog v-model="visible" title="新增图片关系" width="560px" @closed="onClosed">
    <div class="form-grid">
      <div class="left">
        <el-upload
          class="uploader"
          drag
          :show-file-list="false"
          :auto-upload="false"
          :on-change="onFileChange"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">将文件拖到此处，或点击上传</div>
          <template #tip>
            <div class="el-upload__tip">支持图片文件，单文件上传</div>
          </template>
        </el-upload>
        <div v-if="previewUrl" class="preview">
          <el-image :src="previewUrl" fit="contain" style="width: 220px; height: 220px; border: 1px solid #ebeef5;" />
        </div>
      </div>
      <div class="right">
        <el-form label-width="90px">
          <el-form-item label="权重">
            <el-input-number v-model="form.weight" :min="0" :max="999999" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" :max="999999" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="form.isActiveSwitch" />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close" :disabled="submitting">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitting">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createAppDailyRelation } from '@/api/app-daily'

interface Props {
  modelValue: boolean
  appId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const DEFAULT_WEIGHT = 100
const DEFAULT_SORT = 0
const form = ref<{ weight: number | null; sort: number | null; isActiveSwitch: boolean }>({
  weight: DEFAULT_WEIGHT,
  sort: DEFAULT_SORT,
  isActiveSwitch: true
})
const fileObj = ref<File | null>(null)
const previewUrl = ref<string>('')
const submitting = ref(false)

const reset = () => {
  form.value = { weight: DEFAULT_WEIGHT, sort: DEFAULT_SORT, isActiveSwitch: true }
  fileObj.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

const onFileChange = (uploadFile: any) => {
  const raw: File | undefined = uploadFile?.raw
  if (raw) {
    fileObj.value = raw
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(raw)
  }
}

const close = () => {
  visible.value = false
}

const onClosed = () => {
  reset()
}

const submit = async () => {
  try {
    submitting.value = true
    const res = await createAppDailyRelation({
      appId: props.appId,
      weight: form.value.weight ?? undefined,
      sort: form.value.sort ?? undefined,
      isActive: form.value.isActiveSwitch ? 1 : 0,
      file: fileObj.value || undefined
    })
    if (res.code === 0) {
      ElMessage.success('新增成功')
      emit('success')
      close()
    } else {
      ElMessage.error(res.msg || '新增失败')
    }
  } catch (e) {
    // 错误提示由拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.preview {
  margin-top: 12px;
}
</style>
