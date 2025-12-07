<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑素材' : '新建素材'"
    width="560"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="素材类型" prop="analogAssetType">
        <el-select v-model="form.analogAssetType" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="opt in AnalogAssetTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="素材文件" :required="!isEdit">
        <SvgUpload
          ref="svgUploadRef"
          :file-url="fileUrl"
          :disabled="isEdit"
          @change="handleFileChange"
        />
        <div v-if="!isEdit && !form.analogAssetType" class="upload-tip">
          请先选择素材类型
        </div>
      </el-form-item>
      <el-form-item label="系统素材">
        <el-switch v-model="form.isSystem" />
      </el-form-item>
      
      <el-form-item label="启用">
        <el-switch v-model="form.isActive" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { updateAnalogAsset, uploadAnalogAsset } from '@/api/analog-asset'
import type { AnalogAssetVO, AnalogAssetType } from '@/types/analog-asset'
import { AnalogAssetTypeOptions } from '@/types/analog-asset'
import SvgUpload from './SvgUpload.vue'

interface Props {
  modelValue: boolean
  /** 编辑时传入的素材数据，新建时为 null */
  asset?: AnalogAssetVO | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  asset: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.asset?.id)

const formRef = ref<FormInstance>()
const svgUploadRef = ref<InstanceType<typeof SvgUpload>>()
const submitting = ref(false)
const fileUrl = ref('')
const selectedFile = ref<File | null>(null)

interface FormState {
  analogAssetType: AnalogAssetType | ''
  isSystem: boolean
  isActive: boolean
}

const form = reactive<FormState>({
  analogAssetType: '',
  isSystem: true,
  isActive: true
})

const rules: FormRules = {
  analogAssetType: [{ required: true, message: '请选择素材类型', trigger: 'change' }]
}

// Reset form helper - defined before watch to avoid hoisting issues
const resetForm = () => {
  Object.assign(form, {
    analogAssetType: '',
    isSystem: true,
    isActive: true
  })
  fileUrl.value = ''
  selectedFile.value = null
}

// Handle file selection
const handleFileChange = (file: File | null) => {
  selectedFile.value = file
}

// Watch asset prop to populate form
watch(
  () => props.asset,
  (asset) => {
    if (asset) {
      Object.assign(form, {
        analogAssetType: asset.analogAssetType,
        isSystem: asset.isSystem,
        isActive: asset.isActive
      })
      fileUrl.value = asset.file?.url || ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Watch visible to reset form on open for create
watch(visible, (val) => {
  if (val && !props.asset) {
    resetForm()
  }
})

const handleClosed = () => {
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value && props.asset?.id) {
        // 编辑模式：更新属性
        const res = await updateAnalogAsset({
          id: props.asset.id,
          analogAssetType: form.analogAssetType as AnalogAssetType,
          isSystem: form.isSystem,
          isActive: form.isActive
        })
        if (res.code === 0) {
          ElMessage.success('更新成功')
          visible.value = false
          emit('saved')
        }
      } else {
        // 新建模式：上传文件创建素材
        if (!selectedFile.value) {
          ElMessage.warning('请先选择素材文件')
          submitting.value = false
          return
        }
        const res = await uploadAnalogAsset(
          selectedFile.value,
          form.analogAssetType as AnalogAssetType,
          { isSystem: form.isSystem }
        )
        if (res.code === 0 && res.data) {
          // 上传成功后更新其他属性
          const asset = res.data
          await updateAnalogAsset({
            id: asset.id,
            isActive: form.isActive
          })
          ElMessage.success('创建成功')
          visible.value = false
          emit('saved')
        }
      }
    } catch {
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
