<template>
  <div class="auth-callback">
    <p v-if="loading">正在登录，请稍候...</p>
    <p v-else-if="error">登录失败：{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSsoToken } from '@/api/sso'
import type { SsoTokenResponseData } from '@/types/sso'
import { getUserInfo } from '@/api/auth'
import type { ApiResponse } from '@/types/api'
import { useUserStore } from '@/store/user'

const loading = ref(true)
const error = ref('')
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const clientId = 'dashboard'
const clientSecret = 'xxx'
const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI

onMounted(async () => {
  console.log('onMounted', userStore.userInfo)
  const code = route.query.code as string
  if (!code) {
    error.value = '未获取到 code 参数'
    loading.value = false
    return
  }
  try {
    const res: ApiResponse<SsoTokenResponseData> = await fetchSsoToken({
      code,
      clientId,
      clientSecret,
      redirectUri
    })
    console.log(' res', res)
    if (res.code === 0 && res.data?.accessToken) {
      userStore.token = res.data.accessToken
      // 获取用户信息并保存
      try {
        const userRes = await getUserInfo()
        if (userRes.code === 0 && userRes.data) {
          userStore.setUserInfo(userRes.data)
        }
      } catch (e) {
        // 可选：用户信息获取失败处理
        console.error('获取用户信息失败', e)
      }
      router.replace('/')
    } else {
      error.value = res.msg || '登录失败'
      const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
      const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
      window.location.href = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`
    }
  } catch (e: any) {
    error.value = e?.response?.data?.msg || e.message || '请求失败'
    const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
    const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
    window.location.href = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.auth-callback {
  padding: 40px;
  text-align: center;
}
</style> 