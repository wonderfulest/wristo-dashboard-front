<template>
  <div class="account-page">
    <h2>个人信息</h2>
    <el-form
      v-if="userInfo"
      :model="form"
      label-width="90px"
      class="profile-form"
      @submit.prevent
    >
      <el-form-item label="头像">
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :on-change="handleAvatarChange"
          :auto-upload="false"
        >
          <img v-if="form.avatar" :src="form.avatar" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><i class="el-icon-plus" /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" disabled />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.phone" disabled />
      </el-form-item>
      <el-form-item label="注册时间">
        <el-input v-model="form.createdAt" disabled />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </el-form-item>
    </el-form>
    <el-skeleton v-else :rows="6" animated />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getUserInfo, updateUserInfo, uploadAvatar } from '@/api/user'
import type { UserInfo, ApiResponse } from '@/types/api'
import { ElMessage } from 'element-plus'

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

function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

async function handleAvatarChange(fileObj: any) {
  const file = fileObj.raw
  if (!beforeAvatarUpload(file)) return
  try {
    const res: ApiResponse<string> = await uploadAvatar(file)
    if (res.code === 0) {
      form.avatar = res.data || ''
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(res.msg || '头像上传失败')
    }
  } catch (e) {
    ElMessage.error('头像上传失败')
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
.account-page {
  padding: 32px;
  background: #fff;
  min-height: 300px;
  max-width: 480px;
  margin: 0 auto;
}
.profile-form {
  margin-top: 32px;
}
.avatar-uploader {
  display: flex;
  align-items: center;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #eee;
}
.avatar-uploader-icon {
  font-size: 32px;
  color: #bbb;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed #eee;
  border-radius: 50%;
  background: #fafbfc;
}
</style> 