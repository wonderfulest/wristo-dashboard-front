import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { NodeTypes, createSimpleExpression, type NodeTransform } from '@vue/compiler-dom'
import { fileURLToPath, URL } from 'url'

// Attach the same native table behavior to every dashboard SFC, including dialogs.
const tableCounts = new WeakMap<object, Map<string, number>>()
const persistentTableWidths: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT || !['el-table', 'ElTable'].includes(node.tag)) return
  const data = node.props.find(p => p.type === NodeTypes.DIRECTIVE && p.arg?.type === NodeTypes.SIMPLE_EXPRESSION && p.arg.content === 'data')
  const source = data?.type === NodeTypes.DIRECTIVE ? data.exp?.loc.source : ''
  const base = context.filename.split('/src/').pop() + ':' + (source || 'table')
  const counts = tableCounts.get(context.root) || new Map<string, number>()
  tableCounts.set(context.root, counts)
  const index = counts.get(base) || 0
  counts.set(base, index + 1)
  node.props.push({
    type: NodeTypes.DIRECTIVE, name: 'bind', arg: undefined, modifiers: [], loc: node.loc,
    exp: createSimpleExpression(`_ctx.$tableWidths(${JSON.stringify(base + ':' + index)})`, false),
  })
}

const joinUrl = (baseUrl: string | undefined, path: string) => `${(baseUrl || '').replace(/\/$/, '')}/${path}`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const sharedEnvDir = fileURLToPath(new URL('..', import.meta.url))
  const envDir = fileURLToPath(new URL(mode === 'prod' || mode === 'production' ? '.' : '..', import.meta.url))
  const env = { ...loadEnv(mode, sharedEnvDir, ''), ...loadEnv(mode, envDir, '') }

  return {
    envDir,
    define: {
      'import.meta.env.VITE_WRISTO_SSO_REDIRECT_URI': JSON.stringify(env.VITE_WRISTO_DASHBOARD_SSO_REDIRECT_URI || ''),
      'import.meta.env.VITE_WRISTO_SSO_LOGIN_URL': JSON.stringify(joinUrl(env.VITE_WRISTO_SSO_URL, 'login')),
      'import.meta.env.VITE_WRISTO_API_BASE_URL': JSON.stringify(env.VITE_WRISTO_DASHBOARD_API_BASE_URL || ''),
    },
    plugins: [
      vue({ template: { compilerOptions: { nodeTransforms: [persistentTableWidths] } } })
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
