import { createApp } from 'vue'
import './assets/styles/global.scss'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)
app.use(ElementPlus)

console.log('当前运行环境:', import.meta.env.MODE)
console.log('VITE_SSO_LOGIN_URL:', import.meta.env.VITE_SSO_LOGIN_URL)
console.log('VITE_SSO_REDIRECT_URI:', import.meta.env.VITE_SSO_REDIRECT_URI)

app.mount('#app')


