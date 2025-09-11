import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/db-backups',
      name: 'DbBackups',
      component: () => import('@/views/DbBackups.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/system-config',
      name: 'SystemConfig',
      component: () => import('@/views/SystemConfig.vue'),
      meta: { requiresAuth: true }
    },
    // Orders module (new nested paths)
    {
      path: '/orders/history',
      name: 'OrdersHistory',
      component: () => import('@/views/History.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/discounts',
      name: 'OrdersDiscounts',
      component: () => import('@/views/Discounts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/subscription-plans',
      name: 'OrdersSubscriptionPlans',
      component: () => import('@/views/SubscriptionPlans.vue'),
      meta: { requiresAuth: true }
    },
    // Backward-compatible redirects
    {
      path: '/subscription-plans',
      redirect: '/orders/subscription-plans'
    },
    {
      path: '/user-management',
      name: 'UserManagement',
      component: () => import('@/views/UserManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/role-management',
      name: 'RoleManagement',
      component: () => import('@/views/RoleManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dict',
      name: 'Dict',
      component: () => import('@/views/Dict.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/design-review',
      name: 'DesignReview',
      component: () => import('@/views/DesignReview.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('@/views/Products.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant',
      name: 'Merchant',
      component: () => import('@/views/Merchant.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/tools',
      name: 'MerchantTools',
      component: () => import('@/views/MerchantTools.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/payouts',
      name: 'MerchantPayouts',
      component: () => import('@/views/MerchantPayouts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/refund',
      name: 'MerchantRefund',
      component: () => import('@/views/MerchantRefund.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      redirect: '/orders/history'
    },
    {
      path: '/discounts',
      redirect: '/orders/discounts'
    },
    {
      path: '/fonts',
      name: 'Fonts',
      component: () => import('@/views/Fonts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'Categories',
      component: () => import('@/views/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/packaging-logs',
      name: 'PackagingLogs',
      component: () => import('@/views/PackagingLogs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/views/AuthCallback.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
   
  ]
})

// 路由守卫
router.beforeEach((to, _, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
  const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
  const ssoLoginUrl = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`

  console.log('beforeEach userInfo', userStore.userInfo)
  if (requiresAuth && !userStore.userInfo) {
    window.location.href = ssoLoginUrl
    return
  } else {
    next()
  }
})

export default router
