import axios from 'axios'
import { ElMessage } from 'element-plus'
import { BizErrorCode } from '@/constant/errorCode'
import type { ApiResponse } from '@/types/api'
import { useUserStore } from '@/store/user'

const instance = axios.create({
  baseURL: '/api', // 走 vite 代理
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(config => {
  const userStore = useUserStore()
  const token = userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res: ApiResponse<any> = response.data
    if (res.code === BizErrorCode.SUCCESS) {
      return response.data // 返回原始 response
    } else {
      ElMessage.error(response.data.msg || 'http error')
      return Promise.reject(response.data)
    }
  },
  error => {
    if (error.response?.status === 403) {
      console.log('403', error.response)
      ElMessage.error('403 forbidden')
      setTimeout(() => {
        const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
        const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
        window.location.href = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`  
      }, 1000)
    } else {
      ElMessage.error(error.response.data.msg || 'http error')
    }
    return Promise.reject(error)
  }
)

export default instance
