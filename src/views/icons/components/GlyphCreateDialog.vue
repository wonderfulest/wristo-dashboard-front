<template>
  <el-dialog v-model="visible" title="新增图标字体" width="600px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="glyphCode" prop="glyphCode">
        <el-input v-model="form.glyphCode" placeholder="小写英文单词，用中划线连接，如: shopping-cart" />
      </el-form-item>
      <el-form-item label="style">
        <el-select v-model="form.style" placeholder="可选" clearable filterable style="width: 100%">
          <el-option v-for="s in stylesOptions" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认">
        <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <div style="color:#909399; font-size:12px; line-height:1.5; margin-left:100px;">
        glyphCode 需唯一，格式：小写英文单词，使用中划线连接（示例：shopping-cart）。
      </div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createIconGlyph, listGlyphStyles } from '@/api/icon-glyph'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'created'): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const formRef = ref()
const form = ref<{ glyphCode: string; style?: string; isDefault: number; isActive: number }>({ glyphCode: '', style: '', isDefault: 0, isActive: 1 })

const rules = {
  glyphCode: [
    { required: true, message: '请填写 glyphCode', trigger: 'blur' },
    { pattern: /^[a-z]+(-[a-z]+)*$/, message: '格式：小写英文单词用中划线连接，如 shopping-cart', trigger: ['blur', 'change'] }
  ]
}

const stylesOptions = ref<string[]>([])
const loadStyles = async () => {
  if (stylesOptions.value.length) return
  try {
    const resp = await listGlyphStyles()
    stylesOptions.value = (resp as any)?.data || []
  } catch {}
}

watch(() => visible.value, v => { if (v) { form.value = { glyphCode: '', style: '', isDefault: 0, isActive: 1 }; loadStyles() } })

const submitting = ref(false)
const submit = async () => {
  const formEl = formRef.value as any
  if (formEl) {
    const valid = await formEl.validate().catch(() => false)
    if (!valid) return
  }
  submitting.value = true
  try {
    await createIconGlyph({
      glyphCode: form.value.glyphCode,
      style: form.value.style || undefined,
      isDefault: form.value.isDefault,
      isActive: form.value.isActive
    } as any)
    ElMessage.success('新增成功')
    visible.value = false
    emit('created')
  } catch {
    ElMessage.error('新增失败')
  } finally {
    submitting.value = false
  }
}
</script>
