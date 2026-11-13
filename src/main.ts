import { installUserActivity } from './utils/userActivity'
import { createApp } from 'vue'
import './assets/styles/global.scss'
import './style.css'
import { tableWidths } from './utils/tableWidths'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
app.config.globalProperties.$tableWidths = tableWidths
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)
app.use(ElementPlus)

console.log('当前运行环境:', import.meta.env.MODE)
console.log('VITE_WRISTO_SSO_LOGIN_URL:', import.meta.env.VITE_WRISTO_SSO_LOGIN_URL)
console.log('VITE_WRISTO_SSO_REDIRECT_URI:', import.meta.env.VITE_WRISTO_SSO_REDIRECT_URI)

app.mount('#app')



installUserActivity()
