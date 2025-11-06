<template>
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <span class="logo-icon">W</span>
        <span class="logo-text">risto</span>
      </div>
      <nav class="nav-list">
        <router-link
          v-for="group in topMenus"
          :key="group.key"
          :to="group.children[0]?.path || '/'"
          class="nav-item"
          :class="{ active: isTopActive(group) }"
        >
          {{ group.title }}
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-profile-dropdown">
          <div class="user-profile-name" @click="toggleDropdown">
            {{ userStore.userInfo?.username }}
            <span class="dropdown-arrow">▼</span>
          </div>
          <div class="dropdown-content" v-if="isDropdownOpen">
            <a href="/account/profile">编辑资料</a>
            <a href="/account/password">修改密码</a>
            <a href="#" @click.prevent="handleLogout">退出登录</a>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { topMenus } from '@/config/menu'

const userStore = useUserStore()
const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
const handleLogout = async () => {
  await userStore.logout()
  window.location.href = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`
}

// 下拉菜单控制
const isDropdownOpen = ref(false)
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 顶部菜单激活态
const route = useRoute()
const isTopActive = (group: any) => group.basePaths?.some((p: string) => route.path.startsWith(p))
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.header {
  background: $color-bg;
  color: $color-link;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  position: relative;
}
.logo {
  display: flex;
  align-items: center;
  font-size: 2.2rem;
  font-weight: bold;
}
.logo-icon { color: $color-success; font-size: 2.2rem; font-weight: 700; margin-right: 6px; }
.logo-text { color: $color-link; font-weight: 700; font-size: 2.2rem; }
.nav-list { display: flex; gap: 32px; align-items: center; margin-left: 48px; }
.nav-item { color: $color-link; font-weight: 500; text-decoration: none; font-size: 1.1rem; transition: color 0.2s; }
.nav-item.active, .nav-item:hover { color: $color-success; }
.header-right { display: flex; gap: 24px; align-items: center; }

.dropdown-content {
  display: flex; flex-direction: column; align-items: flex-start; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.12); border-radius: 8px; padding: 10px 0; position: absolute; right: 0; top: 64px; min-width: 160px; z-index: 100;
}
.dropdown-content a {
  width: 100%; padding: 10px 24px; color: #222; text-decoration: none; font-size: 1rem; transition: background 0.2s, color 0.2s; box-sizing: border-box; display: block;
}
.dropdown-content a:hover { background: #f5f5f5; color: #19b36b; }
.user-profile-dropdown { position: relative; height: 64px; display: flex; align-items: center; cursor: pointer; }
.user-profile-name { display: flex; align-items: center; gap: 6px; }
</style>
