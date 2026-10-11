<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import ImageGalleryUpload from '@/components/common/ImageGalleryUpload.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'
import type { ImageVO } from '@/types/image'
import { getUtilityConfigs, saveUtilityConfig, type UtilityConfig } from '@/api/utilities'
const items = ref<UtilityConfig[]>([]), loading = ref(false), saving = ref(false), visible = ref(false), error = ref('')
const form = ref<UtilityConfig | null>(null), formRef = ref<FormInstance>()
const rules: FormRules = Object.fromEntries(['name', 'nameZh', 'summary', 'summaryZh', 'description', 'descriptionZh', 'instructions', 'instructionsZh'].map(k => [k, [{ required: true, message: '请填写该项', trigger: 'blur' }]]))
for (const field of ['logoUrl', 'coverUrl', 'heroUrl', 'downloadUrl']) {
  rules[field] = [{ validator: (_rule, value, callback) => {
    if (!value) return callback()
    try {
      const url = new URL(value)
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error()
      callback()
    } catch { callback(new Error('请填写完整的 HTTPS 地址')) }
  }, trigger: 'blur' }]
}
async function load() { loading.value = true; error.value = ''; try { items.value = (await getUtilityConfigs()).data ?? [] } catch { error.value = '工具配置加载失败，请重试。' } finally { loading.value = false } }
const activeUploads = ref<Record<string, boolean>>({})
function edit(row: UtilityConfig) {
  imageIds.value = {}; activeUploads.value = {}
  const urls = row.shareUrls ?? []
  form.value = { ...row, summary: row.summary ?? row.description.slice(0, 300), summaryZh: row.summaryZh ?? row.descriptionZh.slice(0, 300), shareUrls: [...urls] }; visible.value = true
}
async function save() {
  if (Object.values(activeUploads.value).some(Boolean)) return
  if (!form.value || !(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try { await saveUtilityConfig(form.value); visible.value = false; ElMessage.success('工具资料已保存'); await load() } catch { /* The shared HTTP client displays the request error; keep edits open. */ } finally { saving.value = false }
}
type ImageField = 'logoUrl' | 'coverUrl' | 'heroUrl'
const imageIds = ref<Partial<Record<ImageField, number>>>({})
function imageChanged(field: ImageField, id?: number) {
  imageIds.value[field] = id
  if (!id && form.value) form.value[field] = ''
}
function imageUploaded(field: ImageField, image: ImageVO) {
  if (!form.value) return
  const url = safeImageUrl(image.url)
  if (!url) { ElMessage.error('上传结果缺少有效的原图地址，请重新上传'); return }
  form.value[field] = url
  formRef.value?.clearValidate(field)
}
const marketingImages = [
  { key: 'logoUrl', label: '工具 Logo', hint: '独立于工具封面', aspect: 'icon' },
  { key: 'coverUrl', label: 'Banner / 工具封面', hint: '未设置时使用工具默认图形', aspect: 'banner' },
  { key: 'heroUrl', label: 'Hero 图', hint: '用于佳明商店上架的主宣传图', aspect: 'general' },
] as const
const downloading = ref<string | null>(null)
function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch { return null }
}
async function copyImage(value: string | null) {
  const url = safeImageUrl(value)
  if (!url) return
  try { await navigator.clipboard.writeText(url); ElMessage.success('图片链接已复制') }
  catch { ElMessage.error('复制失败，请手动复制地址') }
}
async function downloadImage(value: string | null, kind: string) {
  const url = safeImageUrl(value)
  if (!url || !form.value) return
  const gameKey = form.value.appKey
  downloading.value = kind
  try {
    const response = await fetch(url, { credentials: 'omit' })
    if (!response.ok) throw new Error()
    const blob = await response.blob()
    const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
    const extension = extensions[blob.type]
    if (!extension) throw new Error()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl; link.download = `${gameKey}-${kind}.${extension}`
    document.body.appendChild(link); link.click(); link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch { ElMessage.error('下载失败或图片服务器不允许跨域访问，请打开原图后保存') }
  finally { downloading.value = null }
}
onMounted(load)
</script>
<template>
  <section class="utilities-admin"><header><div><h1>实用工具</h1><p>管理四款实用工具的产品资料、宣传图片、使用指南和网站展示。安装记录指已连接服务的应用安装，不代表商店下载量；个人二维码及配置不在此展示。</p></div><el-button :loading="loading" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-table v-loading="loading" :data="items" empty-text="暂无工具">
      <el-table-column label="Logo" width="86"><template #default="{ row }"><el-image v-if="row.logoUrl" :src="row.logoUrl" class="logo-preview" fit="contain"/><span v-else>未设置</span></template></el-table-column>
      <el-table-column prop="nameZh" label="工具" min-width="140"/>
      <el-table-column prop="name" label="英文名称" min-width="150"/>
      <el-table-column prop="appKey" label="工具标识" min-width="150"/>
      <el-table-column label="网站展示" width="100"><template #default="{ row }"><el-tag :type="row.websiteVisible ? 'success' : 'info'">{{ row.websiteVisible ? '显示' : '隐藏' }}</el-tag></template></el-table-column>
      <el-table-column label="应用服务" width="100"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'danger'">{{ row.enabled ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column prop="installationCount" label="安装记录" width="100"/>
      <el-table-column prop="boundInstallationCount" label="已绑定安装" width="115"/>
      <el-table-column prop="boundUserCount" label="绑定用户" width="100"/>
      <el-table-column prop="sortOrder" label="排序" width="80"/>
      <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="edit(row)">编辑资料</el-button></template></el-table-column>
    </el-table>
    <el-dialog v-model="visible" title="工具资料" width="min(760px, 95vw)" :close-on-click-modal="false" destroy-on-close :show-close="!saving && !Object.values(activeUploads).some(Boolean)" :close-on-press-escape="!saving && !Object.values(activeUploads).some(Boolean)">
      <el-form v-if="form" ref="formRef" :model="form" :inert="saving || undefined" :rules="rules" label-position="top" :disabled="saving">
        <el-alert :title="form.appKey" type="info" :closable="false"/>
        <div class="two"><el-form-item label="英文名称" prop="name"><el-input v-model="form.name" maxlength="64"/></el-form-item><el-form-item label="中文名称" prop="nameZh"><el-input v-model="form.nameZh" maxlength="80"/></el-form-item></div>
        <el-form-item label="工具简述（英文，显示在外层卡片）" prop="summary"><el-input v-model="form.summary" type="textarea" :rows="2" maxlength="300" show-word-limit/></el-form-item>
        <el-form-item label="工具简述（中文，显示在外层卡片）" prop="summaryZh"><el-input v-model="form.summaryZh" type="textarea" :rows="2" maxlength="300" show-word-limit/></el-form-item>
        <el-form-item label="详细描述（英文）" prop="description"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="4000"/></el-form-item>
        <el-form-item label="详细描述（中文）" prop="descriptionZh"><el-input v-model="form.descriptionZh" type="textarea" :rows="3" maxlength="4000"/></el-form-item>
        <el-form-item label="使用指南（英文）" prop="instructions"><el-input v-model="form.instructions" type="textarea" :rows="3" maxlength="4000"/></el-form-item>
        <el-form-item label="使用指南（中文）" prop="instructionsZh"><el-input v-model="form.instructionsZh" type="textarea" :rows="3" maxlength="4000"/></el-form-item>
        <el-divider content-position="left">工具图片与佳明上架素材</el-divider>
        <el-form-item v-for="image in marketingImages" :key="image.key" :label="image.label" :prop="image.key">
          <ImageUpload :key="`${form.appKey}-${image.key}`" :model-value="imageIds[image.key]" :preview-url="form[image.key] || undefined" :aspect-code="image.aspect"
            @uploading="activeUploads[image.key] = $event" @update:model-value="imageChanged(image.key, $event)" @uploaded="imageUploaded(image.key, $event)" />
          <div class="asset-hint">{{ image.hint }}</div>
          <template v-if="safeImageUrl(form[image.key])">
            <div class="asset-actions">
              <el-button size="small" @click="copyImage(form[image.key])">复制链接</el-button>
              <el-button size="small" :loading="downloading === image.key" :disabled="downloading !== null" @click="downloadImage(form[image.key], image.key)">下载图片</el-button>
              <el-link :href="safeImageUrl(form[image.key])!" target="_blank" rel="noopener noreferrer" type="primary">打开原图 ↗</el-link>
            </div>
          </template>
        </el-form-item>
        <el-form-item label="分享图（最多 5 张）">
          <ImageGalleryUpload v-model="form.shareUrls" :limit="5" :disabled="saving" @uploading="activeUploads.share = $event">
            <template #actions="{ url, index }">
              <div class="asset-actions">
                <el-button size="small" @click="copyImage(url)">复制链接</el-button>
                <el-button size="small" :loading="downloading === `share-${index + 1}`" :disabled="downloading !== null" @click="downloadImage(url, `share-${index + 1}`)">下载</el-button>
                <el-link :href="safeImageUrl(url) || undefined" target="_blank" rel="noopener noreferrer" type="primary">打开原图</el-link>
              </div>
            </template>
          </ImageGalleryUpload>
        </el-form-item>
        <el-form-item label="佳明 Connect IQ 商店地址（HTTPS，未上线时留空）" prop="downloadUrl"><el-input v-model.trim="form.downloadUrl" maxlength="1000"/></el-form-item>
        <div class="two"><el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" :max="10000"/></el-form-item><el-form-item label="网站展示"><el-switch v-model="form.websiteVisible" active-text="在网站显示"/><div class="asset-hint">隐藏只影响网站产品展示，不中断手表同步。</div></el-form-item></div><el-form-item label="应用服务"><el-switch v-model="form.enabled" active-text="启用"/><div class="asset-hint">停用将阻止手表连接服务，并从网站隐藏。仅需下架产品页时，请关闭网站展示。</div></el-form-item>
      </el-form><template #footer><el-button :disabled="saving || Object.values(activeUploads).some(Boolean)" @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" :disabled="Object.values(activeUploads).some(Boolean)" @click="save">保存</el-button></template>
    </el-dialog>
  </section>
</template>
<style scoped>.share-images{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;width:100%}.share-image{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.asset-hint{width:100%;color:#64748b;font-size:12px}.asset-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px}.banner-preview{width:100%;height:160px;margin-top:10px;border-radius:8px;background:#f1f5f9}.logo-preview{width:56px;height:56px;flex-shrink:0;border-radius:8px;margin-top:6px;font-size:12px}.utilities-admin{padding:24px}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:25px}h1{margin:0 0 8px}p{color:#64748b}.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}.el-alert{margin-bottom:18px}@media(max-width:640px){.two{grid-template-columns:1fr}}</style>
