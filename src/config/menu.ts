export interface SubMenuItem {
  key: string
  title: string
  path: string
}

export interface TopMenuGroup {
  key: string
  title: string
  // 用于自动判断当前路由属于哪个分组
  basePaths: string[]
  children: SubMenuItem[]
}

export const topMenus: TopMenuGroup[] = [
  {
    key: 'official',
    title: '官网运营',
    basePaths: ['/dashboard', '/products', '/categories', '/discounts', '/history', '/design-review', '/packaging-logs', '/subscription-plans', '/fonts', '/images', '/app-daily', '/data-type-options', '/icon-assets'],
    children: [
      { key: 'dashboard', title: '仪表盘', path: '/dashboard' },
      { key: 'products', title: '作品管理', path: '/products' },
      { key: 'categories', title: '分类管理', path: '/categories' },
      { key: 'design-review', title: '设计审核', path: '/design-review' },
      { key: 'packaging-logs', title: '打包记录', path: '/packaging-logs' },
      { key: 'fonts', title: '字体管理', path: '/fonts' },
      { key: 'images', title: '图片素材', path: '/images' },
      { key: 'app-daily-config', title: '每日一图配置', path: '/app-daily/config' },
      { key: 'data-type-options', title: '数据项配置', path: '/data-type-options' },
      { key: 'icon-library', title: '图标库', path: '/icon-library' },
      { key: 'icon-assets', title: '图标素材', path: '/icon-assets' },
    ],
  },
  {
    key: 'marketing',
    title: '营销工具',
    basePaths: ['/marketing'],
    children: [
      // { key: 'customers', title: '客户管理', path: '/marketing/customers' },
      { key: 'user-profiles', title: '用户画像', path: '/marketing/user-profiles' },
      // { key: 'tags', title: '标签管理', path: '/marketing/tags' },
      { key: 'segments', title: '用户分群', path: '/marketing/segments' },
      { key: 'email-templates', title: '邮件模板', path: '/marketing/email-templates' },
      { key: 'promotion-campaigns', title: '营销活动', path: '/marketing/campaigns' },
      { key: 'email-records', title: '邮件发送历史', path: '/marketing/email-records' },
    ],
  },
  {
    key: 'ops',
    title: '运维工具',
    basePaths: ['/db-backups', '/system-config'],
    children: [
      { key: 'db-backups', title: '数据库备份', path: '/db-backups' },
      { key: 'system-config', title: '系统配置', path: '/system-config' },
    ],
  },
  {
    key: 'orders',
    title: '订单管理',
    basePaths: ['/orders'],
    children: [
      { key: 'history', title: '订单记录', path: '/orders/history' },
      { key: 'refund', title: '订单退款', path: '/orders/refund' },
      { key: 'discounts', title: '优惠管理', path: '/orders/discounts' },
      { key: 'subscription-plans', title: '订阅计划', path: '/orders/subscription-plans' },
    ],
  },
  {
    key: 'users',
    title: '用户管理',
    basePaths: ['/user-management', '/role-management', '/dict', '/profile'],
    children: [
      { key: 'user-management', title: '用户管理', path: '/user-management' },
      { key: 'role-management', title: '角色管理', path: '/role-management' },
      { key: 'dict', title: '字典管理', path: '/dict' },
      { key: 'profile', title: '个人资料', path: '/profile' },
    ],
  },
  {
    key: 'merchant',
    title: '商家中心',
    basePaths: ['/merchant'],
    children: [
      { key: 'merchant', title: '商家管理', path: '/merchant' },
      { key: 'merchant-tools', title: '商家工具', path: '/merchant/tools' },
      { key: 'merchant-payouts', title: '结算管理', path: '/merchant/payouts' },
    ],
  },
]