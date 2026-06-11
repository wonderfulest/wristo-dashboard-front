import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

const joinUrl = (baseUrl: string | undefined, path: string) => `${(baseUrl || '').replace(/\/$/, '')}/${path}`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('..', import.meta.url))
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    define: {
      'import.meta.env.VITE_WRISTO_SSO_REDIRECT_URI': JSON.stringify(env.VITE_WRISTO_DASHBOARD_SSO_REDIRECT_URI || ''),
      'import.meta.env.VITE_WRISTO_SSO_LOGIN_URL': JSON.stringify(joinUrl(env.VITE_WRISTO_SSO_URL, 'login')),
      'import.meta.env.VITE_WRISTO_API_BASE_URL': JSON.stringify(env.VITE_WRISTO_DASHBOARD_API_BASE_URL || ''),
    },
    plugins: [
      vue()
    ],
    base: '/', // Ensure base URL is set to root
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true, // 监听所有地址
      port: 3002,
      strictPort: true,
      proxy: {
        '^/api/.*': {
          target: 'http://localhost:8088',
          // target:  'https://api.wristo.io',
          changeOrigin: true,
          secure: false,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        }
      },
    },
  }
})
