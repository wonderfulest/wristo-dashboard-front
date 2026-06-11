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
import { getUserInfo } from '@/api/user'
import type { ApiResponse } from '@/types/api'
import { useUserStore } from '@/store/user'
import { getSsoRedirectUri, redirectToSsoLogin } from '@/utils/ssoRedirect'

const loading = ref(true)
const error = ref('')
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const clientId = 'dashboard'
const redirectUri = getSsoRedirectUri()

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
          router.replace('/')
        } else {
          error.value = userRes.msg || '当前账号无权限访问'
        }
      } catch (e) {
        console.error('获取用户信息失败', e)
        error.value = '当前账号无权限访问'
      }
    } else {
      error.value = res.msg || '登录失败'
      redirectToSsoLogin('dashboard')
    }
  } catch (e: any) {
    error.value = e?.response?.data?.msg || e.message || '请求失败'
    redirectToSsoLogin('dashboard')
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
