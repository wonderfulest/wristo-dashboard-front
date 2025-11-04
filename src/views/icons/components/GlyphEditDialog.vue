<template>
  <el-dialog v-model="visible" title="编辑图标字体" width="600px">
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
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updateIconGlyph, listGlyphStyles } from '@/api/icon-glyph'
import type { IconGlyphVO } from '@/types/icon-glyph'

const props = defineProps<{ modelValue: boolean; glyph?: Partial<IconGlyphVO> | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'updated'): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const formRef = ref()
const form = ref<{ id?: number; glyphCode?: string; style?: string; isDefault?: number; isActive?: number }>({})

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

watch(
  () => visible.value,
  v => {
    if (v) {
      form.value = {
        id: props.glyph?.id,
        glyphCode: props.glyph?.glyphCode,
        style: props.glyph?.style,
        isDefault: props.glyph?.isDefault,
        isActive: props.glyph?.isActive
      }
      loadStyles()
    }
  }
)

const submitting = ref(false)
const submit = async () => {
  const formEl = formRef.value as any
  if (formEl) {
    const valid = await formEl.validate().catch(() => false)
    if (!valid) return
  }
  if (!form.value.id) return
  submitting.value = true
  try {
    await updateIconGlyph(form.value.id, {
      glyphCode: form.value.glyphCode,
      style: form.value.style || undefined,
      isDefault: form.value.isDefault,
      isActive: form.value.isActive
    } as any)
    ElMessage.success('保存成功')
    visible.value = false
    emit('updated')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}
</script>
