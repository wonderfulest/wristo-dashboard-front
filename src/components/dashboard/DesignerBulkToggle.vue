<template>
  <div class="designer-bulk">
    <el-card shadow="hover">
      <div class="header">
        <div class="title">设计师批量上/下线</div>
        <div class="desc">输入设计师用户ID，一键将其名下所有产品上架或下线。</div>
      </div>
      <div class="controls">
        <el-input-number v-model="userId" :min="1" :controls="false" placeholder="输入用户ID" style="width: 220px" />
        <el-button type="danger" :disabled="!userId" :loading="loadingDown" @click="onDown">
          一键下线
        </el-button>
        <el-button type="primary" :disabled="!userId" :loading="loadingUp" @click="onUp">
          一键上架
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { downAllProductsByUser, upAllProductsByUser } from '@/api/products'

const userId = ref<number | null>(null)
const loadingDown = ref(false)
const loadingUp = ref(false)

const confirmDo = async (title: string, cb: () => Promise<any>) => {
  try {
    await ElMessageBox.confirm(
      `确认要${title}该设计师的所有产品吗？`,
      '二次确认',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
    await cb()
  } catch (e) {
    // 用户取消或请求异常都会进入 catch，这里只对异常提示
    if ((e as any)?.message && (e as any).message !== 'cancel') {
      ElMessage.error((e as any).message || '操作失败')
    }
  }
}

const onDown = async () => {
  if (!userId.value) return
  loadingDown.value = true
  await confirmDo('下线', async () => {
    const res = await downAllProductsByUser(userId.value as number)
    if (res.data) {
      ElMessage.success('已下线该设计师的所有产品')
    }
  })
  loadingDown.value = false
}

const onUp = async () => {
  if (!userId.value) return
  loadingUp.value = true
  await confirmDo('上架', async () => {
    const res = await upAllProductsByUser(userId.value as number)
    if (res.data) {
      ElMessage.success('已上架该设计师的所有产品')
    }
  })
  loadingUp.value = false
}
</script>

<style scoped>
.designer-bulk { margin-bottom: 16px; }
.header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
.title { font-size: 16px; font-weight: 600; }
.desc { color: #909399; font-size: 12px; }
.controls { display: flex; gap: 12px; align-items: center; }
</style>
