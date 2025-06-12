<template>
  <div class="api-page">
    <div class="api-header">
      <h1>Merchant API</h1>
    </div>
    <div class="api-content">
      <p class="api-tip">
        Use the Merchant API to get your sales results in JSON format to use in an app or clockface and keep constant track of your sales!
      </p>
      <p class="api-tip">
        Your API key is displayed below, keep this key secret because that key will give anyone access to your sales data. If the key ever gets compromised, use the "Generate new key" button to get a new key and make the old one invalid. This cannot be undone!
      </p>
      <p class="api-tip">
        For more information, check out the <a href="#" target="_blank">documentation</a> of the Merchant API.
      </p>
      <div class="api-key-card">
        <el-card>
          <div class="api-key-label">API Key:</div>
          <el-input v-model="apiKey" readonly class="api-key-input" />
          <el-button type="success" class="generate-btn" :loading="loading" @click="generateKey">GENERATE NEW KEY</el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken, createOrUpdateToken, TOKEN_NAME } from '@/api/merchant-api'
import type { ApiResponse } from '@/types/api'
import type {  TokenData } from '@/api/merchant-api'

const apiKey = ref('')
const loading = ref(false)

onMounted(async () => {
  const res: ApiResponse<TokenData> = await getToken()
  if (res.code === 0) {
    apiKey.value = res.data?.token || ''
    if (!apiKey.value) {
      generateKey()
    }
  } else {
    ElMessage.error(res.msg || 'Failed to get API Key')
  }
})
async function generateKey() {
  loading.value = true
  try {
    const res: ApiResponse<TokenData> = await createOrUpdateToken(TOKEN_NAME)
    if (res.code === 0) {
      apiKey.value = res.data?.token || ''
      ElMessage.success('New API Key generated!')
    } else {
      ElMessage.error(res.msg || 'Failed to generate API Key')
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || 'Failed to generate API Key')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.api-page {
  min-height: 100vh;
  background: $color-bg;
}
.api-header {
  background: $color-header-bg;
  color: $color-header-text;
  padding: 40px 0 24px 0;
  text-align: left;
}
.api-header h1 {
  font-size: $font-size-title;
  font-weight: 400;
  margin: 0 0 0 60px;
  letter-spacing: 2px;
}
.api-content {
  max-width: 900px;
  margin: 32px auto 0 auto;
  padding: 0 16px;
  font-size: $font-size-md;
  color: $color-link;
}
.api-tip {
  font-size: $font-size-sm;
  color: $color-info;
  margin-bottom: 12px;
  line-height: 1.7;
}
.api-key-card {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
.el-card {
  min-width: 480px;
  max-width: 600px;
  padding: 32px 32px 24px 32px;
  box-sizing: border-box;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
}
.api-key-label {
  font-size: $font-size-sm;
  color: $color-link;
  margin-bottom: 8px;
}
.api-key-input {
  width: 100%;
  margin-bottom: 24px;
  font-size: $font-size-lg;
  letter-spacing: 1px;
  background: #f8f8f8;
  border-radius: $border-radius;
}
.generate-btn {
  width: 100%;
  font-size: $font-size-md;
  font-weight: bold;
  background: $color-primary;
  border-color: $color-primary;
}
</style>
