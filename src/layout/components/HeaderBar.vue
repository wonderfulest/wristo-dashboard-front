<template>
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <img class="logo-image" src="https://cdn.wristo.io/brands/wristo-logo/svg/wristo-logo-horizontal.svg" alt="Wristo" />
      </div>
      <nav class="nav-list">
        <router-link
          v-for="group in topMenus"
          :key="group.key"
          :to="getGroupDefaultPath(group)"
          class="nav-item"
          :class="{ active: isTopActive(group) }"
        >
          {{ group.title }}
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-profile-dropdown">
          <div class="user-avatar-container" @click="toggleDropdown">
            <img :src="userAvatar" class="user-avatar" alt="user avatar" />
            <span class="user-profile-name">{{ displayName }}</span>
          </div>
          <div class="dropdown-content" v-if="isDropdownOpen">
            <a href="/profile">编辑资料</a>
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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { topMenus } from '@/config/menu'

const userStore = useUserStore()
const defaultAvatar = 'https://cdn.wristo.io/test/avatar/561aae25-41bd-47ab-974e-7231f5a850e8.png'
const userAvatar = computed(() => userStore.userInfo?.avatar || defaultAvatar)
const displayName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || 'Wristo')
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

const findFirstPath = (items: any[] | undefined): string | undefined => {
  if (!items?.length) return
  for (const item of items) {
    if (item?.path) return item.path
    const nested = findFirstPath(item?.children)
    if (nested) return nested
  }
}

const getGroupDefaultPath = (group: any) => findFirstPath(group?.children) || '/'
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
  flex: 0 0 auto;
}
.logo-image {
  display: block;
  width: 132px;
  height: auto;
}
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
.user-avatar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.user-avatar-container:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}
.user-profile-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $color-link;
  font-size: 0.95rem;
  font-weight: 600;
}
</style>
