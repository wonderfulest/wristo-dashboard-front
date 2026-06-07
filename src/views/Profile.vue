<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-hero">
        <div class="avatar-wrapper">
          <AvatarUpload v-model="form.avatar" />
        </div>
        <div class="hero-name">{{ form.nickname || form.username || 'Wristo' }}</div>
        <div class="hero-email">{{ form.email || '—' }}</div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">个人信息</span>
        </div>
        <div v-if="userInfo" class="section-card">
          <div class="row">
            <div class="row-label">用户名</div>
            <div class="row-value"><el-input v-model="form.username" placeholder="请输入用户名" /></div>
          </div>
          <div class="row-divider" />
          <div class="row">
            <div class="row-label">昵称</div>
            <div class="row-value"><el-input v-model="form.nickname" placeholder="请输入昵称" /></div>
          </div>
          <div class="row-divider" />
          <div class="row">
            <div class="row-label">邮箱</div>
            <div class="row-value text-value">{{ form.email || '—' }}</div>
          </div>
          <div class="row-divider" />
          <div class="row">
            <div class="row-label">手机号</div>
            <div class="row-value text-value">{{ form.phone || '—' }}</div>
          </div>
          <div class="row-divider" />
          <div class="row">
            <div class="row-label">注册时间</div>
            <div class="row-value text-value">{{ form.createdAt || '—' }}</div>
          </div>
          <div class="row-divider" />
          <div class="row save-row">
            <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          </div>
        </div>
        <el-skeleton v-else class="section-card loading-card" :rows="6" animated />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getUserInfo, updateUserInfo } from '@/api/user'
import type { UserInfo, ApiResponse } from '@/types/api'
import { ElMessage } from 'element-plus'
import AvatarUpload from '@/components/common/AvatarUpload.vue'

const userInfo = ref<UserInfo | null>(null)
const loading = ref(true)
const saving = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  phone: '',
  createdAt: ''
})

onMounted(async () => {
  await fetchUserInfo()
})

async function fetchUserInfo() {
  loading.value = true
  try {
    const res: ApiResponse<UserInfo> = await getUserInfo()
    if (res.code === 0 && res.data) {
      userInfo.value = res.data
      Object.assign(form, res.data)
    } else {
      ElMessage.error(res.msg || '获取用户信息失败')
    }
  } catch (e) {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const res: ApiResponse<UserInfo> = await updateUserInfo({
      username: form.username,
      nickname: form.nickname,
      avatar: form.avatar
    })
    if (res.code === 0) {
      ElMessage.success('保存成功')
      await fetchUserInfo()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-page {
  width: 100%;
  min-height: calc(100vh - 64px);
  background: #f2f2f7;
  display: flex;
  justify-content: center;
  padding: 0 16px 48px;
}
.profile-container {
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 40px;
}
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
}
.avatar-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 3px #fff, 0 2px 16px rgba(0, 0, 0, 0.08);
}
.avatar-wrapper :deep(.avatar-upload),
.avatar-wrapper :deep(.avatar-uploader),
.avatar-wrapper :deep(.el-upload),
.avatar-wrapper :deep(.avatar),
.avatar-wrapper :deep(.avatar-uploader-icon) {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
.avatar-wrapper :deep(.avatar) {
  object-fit: cover;
}
.hero-name {
  margin-top: 8px;
  color: #1d1d1f;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
}
.hero-email {
  color: #86868b;
  font-size: 0.9375rem;
  text-align: center;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
}
.section-title {
  color: #86868b;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.section-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.04);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 13px 18px;
}
.row-divider {
  height: 1px;
  margin-left: 18px;
  background: #e5e5ea;
}
.row-label {
  flex: 0 0 96px;
  color: #1d1d1f;
  font-size: 0.9375rem;
}
.row-value {
  flex: 1;
  min-width: 0;
  text-align: right;
}
.text-value {
  color: #6e6e73;
  overflow-wrap: anywhere;
}
.save-row {
  justify-content: flex-end;
}
.loading-card {
  padding: 18px;
}
@media (max-width: 640px) {
  .row {
    align-items: flex-start;
    flex-direction: column;
  }
  .row-label {
    flex-basis: auto;
  }
  .row-value {
    width: 100%;
    text-align: left;
  }
}
</style> 
