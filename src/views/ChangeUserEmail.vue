<template>
  <div class="page">
    <div class="page-header">
      <h2>变更用户邮箱</h2>
      <el-button @click="goBack">返回</el-button>
    </div>

    <el-card v-loading="userLoading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="用户" prop="userId">
          <UserSelect v-model="form.userId" placeholder="输入用户名或邮箱筛选用户" @change="handleUserChange" />
        </el-form-item>
        <el-form-item label="旧邮箱" prop="oldEmail">
          <el-input v-model="form.oldEmail" placeholder="选择用户后自动带出" disabled />
        </el-form-item>
        <el-form-item label="新邮箱" prop="newEmail">
          <el-input v-model="form.newEmail" placeholder="请输入新邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting || userLoading" :disabled="userLoading" @click="handleSubmit">提交变更</el-button>
          <el-button :disabled="submitting || userLoading" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { changeUserEmail, getUserDetail } from '@/api/user'
import UserSelect from '@/components/users/UserSelect.vue'
import type { ChangeUserEmailDTO } from '@/types/user'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const userLoading = ref(false)

const form = reactive<ChangeUserEmailDTO>({
  userId: undefined as any,
  oldEmail: '',
  newEmail: '',
})

const rules = reactive<FormRules<ChangeUserEmailDTO>>({
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  oldEmail: [
    { required: true, message: '请输入旧邮箱', trigger: 'blur' },
    { type: 'email', message: '旧邮箱格式不正确', trigger: 'blur' },
  ],
  newEmail: [
    { required: true, message: '请输入新邮箱', trigger: 'blur' },
    { type: 'email', message: '新邮箱格式不正确', trigger: 'blur' },
  ],
})

async function handleUserChange(val?: number) {
  if (!val) {
    form.oldEmail = ''
    return
  }
  userLoading.value = true
  try {
    const res = await getUserDetail(val)
    if (res.code === 0 && res.data) {
      form.oldEmail = (res.data as any).email || ''
    } else {
      form.oldEmail = ''
      ElMessage.error(res.msg || '获取用户信息失败')
    }
  } catch (e: any) {
    form.oldEmail = ''
    ElMessage.error(e?.msg || e?.message || '获取用户信息失败')
  } finally {
    userLoading.value = false
  }
}

function goBack() {
  router.back()
}

function handleReset() {
  form.userId = undefined as any
  form.oldEmail = ''
  form.newEmail = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm(
        '确认修改邮箱后，原邮箱将不可用，订单数据会迁移至新邮箱',
        '确认变更邮箱',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return
    }

    submitting.value = true
    try {
      const res = await changeUserEmail({
        userId: Number(form.userId),
        oldEmail: form.oldEmail,
        newEmail: form.newEmail,
      })
      if (res.code === 0) {
        ElMessage.success('变更邮箱成功')
      } else {
        ElMessage.error(res.msg || '变更邮箱失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.msg || e?.message || '变更邮箱失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  const qUserId = route.query.userId
  if (typeof qUserId === 'string' && qUserId) {
    const n = Number(qUserId)
    if (!Number.isNaN(n)) {
      form.userId = n as any
      handleUserChange(n)
    }
  }
  const qOldEmail = route.query.oldEmail
  if (typeof qOldEmail === 'string' && qOldEmail) form.oldEmail = qOldEmail
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
</style>
