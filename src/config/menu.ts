export interface SubMenuItem {
  key: string
  title: string
  icon?: string
  path?: string
  children?: SubMenuItem[]
}

export interface TopMenuGroup {
  key: string
  title: string
  icon?: string
  basePaths: string[]
  children: SubMenuItem[]
}

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'

const menuPathMatches = (menuPath: string, currentPath: string) => {
  const normalizedMenuPath = normalizePath(menuPath)
  const normalizedCurrentPath = normalizePath(currentPath)
  if (normalizedMenuPath === normalizedCurrentPath) return true

  if (!normalizedMenuPath.includes(':')) return false

  const pattern = normalizedMenuPath
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${pattern}$`).test(normalizedCurrentPath)
}

export const hasMatchingChildPath = (items: SubMenuItem[], currentPath: string): boolean => {
  return items.some((item) => {
    if (item.path && menuPathMatches(item.path, currentPath)) return true
    return item.children ? hasMatchingChildPath(item.children, currentPath) : false
  })
}

const matchesBasePath = (group: TopMenuGroup, currentPath: string) => {
  return group.basePaths.some((basePath) => {
    const normalizedBasePath = normalizePath(basePath)
    const normalizedCurrentPath = normalizePath(currentPath)
    return normalizedCurrentPath === normalizedBasePath || normalizedCurrentPath.startsWith(`${normalizedBasePath}/`)
  })
}

export const resolveActiveTopMenu = (currentPath: string) => {
  return topMenus.find((group) => hasMatchingChildPath(group.children, currentPath))
    || topMenus.find((group) => matchesBasePath(group, currentPath))
    || topMenus[0]
}

export const isTopMenuActive = (group: TopMenuGroup, currentPath: string) => resolveActiveTopMenu(currentPath)?.key === group.key

export const findFirstPath = (items: SubMenuItem[] | undefined): string | undefined => {
  if (!items?.length) return
  for (const item of items) {
    if (item.path) return item.path
    const nested = findFirstPath(item.children)
    if (nested) return nested
  }
}

export const topMenus: TopMenuGroup[] = [
  {
    key: 'home',
    title: '首页',
    icon: 'House',
    basePaths: ['/dashboard', '/tickets', '/contact-us'],
    children: [
      { key: 'dashboard-overview', title: '业务概览', icon: 'DataBoard', path: '/dashboard' },
      { key: 'dashboard-sales', title: '销售分析', icon: 'TrendCharts', path: '/dashboard/sales' },
      { key: 'dashboard-launch', title: '上线策略', icon: 'Promotion', path: '/dashboard/launch' },
      { key: 'dashboard-value', title: '价值分析', icon: 'Histogram', path: '/dashboard/value' },
      { key: 'tickets', title: '工单管理', icon: 'Tickets', path: '/tickets' },
      { key: 'contact-us', title: '用户反馈', icon: 'ChatDotRound', path: '/contact-us' },
    ],
  },
  {
    key: 'content-production',
    title: '内容生产',
    icon: 'Brush',
    basePaths: ['/design', '/packaging', '/themes', '/data-type-options', '/color-type-options', '/system/template-variables'],
    children: [
      { key: 'design-management', title: '设计管理', icon: 'View', children: [
        { key: 'design-review', title: '设计审核', icon: 'View', path: '/packaging/design-review' },
        { key: 'designs', title: '设计列表', icon: 'Brush', path: '/products/designs' },
        { key: 'inspirations', title: '设计灵感', icon: 'MagicStick', path: '/design/inspirations' },
      ] },
      { key: 'asset-resources', title: '素材资源', icon: 'Collection', children: [
        { key: 'fonts-manage', title: '字体管理', icon: 'Document', path: '/design/fonts' },
        { key: 'icon-library', title: '图标字典', icon: 'Collection', path: '/design/icon-library' },
        { key: 'analog-assets', title: '指针表盘素材', icon: 'Compass', path: '/design/analog-assets' },
      ] },
      { key: 'data-styles', title: '数据与样式', icon: 'Grid', children: [
        { key: 'data-type-options', title: '数据项', icon: 'Grid', path: '/data-type-options' },
        { key: 'template-variables', title: '模板变量', icon: 'Files', path: '/system/template-variables' },
        { key: 'color-type-options', title: '颜色配置', icon: 'BrushFilled', path: '/color-type-options' },
      ] },
      { key: 'theme-system', title: '主题系统', icon: 'CollectionTag', children: [
        { key: 'theme-rules', title: '主题规则', icon: 'Notebook', path: '/themes/rules' },
        { key: 'theme-configs', title: '主题配置', icon: 'Setting', path: '/themes/configs' },
      ] },
      { key: 'build-release', title: '构建发布', icon: 'Box', children: [
        { key: 'packaging-logs', title: '打包记录', icon: 'DocumentChecked', path: '/packaging/packaging-logs' },
        { key: 'packaging-queue', title: '打包任务队列', icon: 'Box', path: '/packaging/packaging-queue' },
        { key: 'packaging-dead-queue', title: '死信队列', icon: 'Warning', path: '/packaging/packaging-dead-queue' },
      ] },
    ],
  },
  {
    key: 'app-operations',
    title: '应用运营',
    icon: 'Grid',
    basePaths: ['/products', '/website/home-banners', '/website/categories', '/meter'],
    children: [
      { key: 'app-management', title: '应用管理', icon: 'Grid', children: [
        { key: 'products-recent-online', title: '最近上线', icon: 'TrendCharts', path: '/products/recent-online' },
        { key: 'products', title: '应用列表', icon: 'Grid', path: '/products' },
        { key: 'bundles', title: 'Bundle 管理', icon: 'Box', path: '/products/bundles' },
        { key: 'categories', title: '应用分类', icon: 'FolderOpened', path: '/website/categories' },
      ] },
      { key: 'content-operations', title: '内容运营', icon: 'Picture', children: [
        { key: 'app-daily-config', title: '每日一图配置', icon: 'Picture', path: '/products/app-daily/config' },
        { key: 'website-home-banners', title: '首页 Banner', icon: 'Picture', path: '/website/home-banners' },
      ] },
      { key: 'garmin-ecosystem', title: 'Garmin 生态', icon: 'Monitor', children: [
        { key: 'garmin-devices', title: '佳明设备', icon: 'Monitor', path: '/products/garmin-devices' },
        { key: 'device-un-support', title: '未支持应用', icon: 'Warning', path: '/products/device-un-support' },
        { key: 'delete-from-garmin', title: '从佳明商城删除', icon: 'Delete', path: '/products/delete-from-garmin' },
      ] },
      { key: 'search-operations', title: '搜索运营', icon: 'Search', children: [
        { key: 'search-records-list', title: '搜索记录', icon: 'Document', path: '/products/search-records' },
        { key: 'final-search-keywords', title: '结果词', icon: 'Aim', path: '/products/final-search-keywords' },
        { key: 'product-keyword-candidates', title: '产品候选关键词', icon: 'Collection', path: '/products/product-keyword-candidates' },
        { key: 'product-keyword-scores', title: '评分表', icon: 'Histogram', path: '/products/product-keyword-scores' },
        { key: 'product-action-suggestions', title: '动作建议', icon: 'Compass', path: '/products/product-action-suggestions' },
        { key: 'search-keyword-pipeline', title: '动作流水线任务', icon: 'Operation', path: '/products/search-keyword-pipeline' },
        { key: 'watchface-search-admin', title: '搜索引擎管理', icon: 'Setting', path: '/products/watchface-search-admin' },
      ] },
      { key: 'app-monitoring', title: '应用监控', icon: 'Monitor', children: [
        { key: 'meter-score', title: '健康评分排行', icon: 'TrendCharts', path: '/meter/score' },
        { key: 'meter-app', title: '应用详情', icon: 'DataAnalysis', path: '/meter/app' },
        { key: 'meter-operation', title: '运维操作', icon: 'Operation', path: '/meter/operation' },
      ] },
    ],
  },
  {
    key: 'users-transactions',
    title: '用户与交易',
    icon: 'User',
    basePaths: ['/users', '/orders', '/merchant', '/website/studio-memberships', '/website/subscription-plans', '/profile'],
    children: [
      { key: 'user-services', title: '用户服务', icon: 'User', children: [
        { key: 'user-management', title: '用户管理', icon: 'User', path: '/users/user-management' },
        { key: 'change-user-email', title: '变更用户邮箱', icon: 'Message', path: '/users/user-management/change-email' },
        { key: 'email-preferences', title: '用户隐私', icon: 'Lock', path: '/users/email-preferences' },
      ] },
      { key: 'memberships-subscriptions', title: '会员与订阅', icon: 'CreditCard', children: [
        { key: 'studio-memberships', title: 'Studio 会员', icon: 'CreditCard', path: '/website/studio-memberships' },
        { key: 'subscription-plans', title: '订阅计划', icon: 'Notebook', path: '/website/subscription-plans' },
      ] },
      { key: 'orders-entitlements', title: '订单与权益', icon: 'CreditCard', children: [
        { key: 'history', title: '订单记录', icon: 'Document', path: '/orders/history' },
        { key: 'entitlement-grants', title: '赠送权益', icon: 'Key', path: '/orders/entitlement-grants' },
        { key: 'trial-records', title: '试用记录', icon: 'Tickets', path: '/orders/trials' },
      ] },
      { key: 'after-sales-promotions', title: '售后与优惠', icon: 'Money', children: [
        { key: 'refund', title: '订单退款', icon: 'Money', path: '/orders/refund' },
        { key: 'paddle-refunds', title: 'Paddle 退款查询', icon: 'CreditCard', path: '/orders/paddle-refunds' },
        { key: 'discounts', title: '优惠管理', icon: 'Discount', path: '/orders/discounts' },
      ] },
      { key: 'merchant-settlement', title: '商家与结算', icon: 'OfficeBuilding', children: [
        { key: 'merchant', title: '商家管理', icon: 'OfficeBuilding', path: '/merchant' },
        { key: 'merchant-tools', title: '商家工具', icon: 'Tools', path: '/merchant/tools' },
        { key: 'merchant-payouts', title: '结算管理', icon: 'Money', path: '/merchant/payouts' },
      ] },
      { key: 'management-settings', title: '管理配置', icon: 'Setting', children: [
        { key: 'paddle-sync', title: 'Paddle 用户同步', icon: 'CreditCard', path: '/users/paddle-sync' },
        { key: 'role-management', title: '角色管理', icon: 'Key', path: '/users/role-management' },
        { key: 'dict', title: '字典管理', icon: 'Collection', path: '/users/dict' },
      ] },
      { key: 'profile', title: '个人资料', icon: 'Avatar', path: '/profile' },
    ],
  },
  {
    key: 'marketing-growth',
    title: '营销增长',
    icon: 'Promotion',
    basePaths: ['/marketing', '/ga', '/email-records'],
    children: [
      { key: 'user-insights', title: '用户洞察', icon: 'UserFilled', children: [
        { key: 'user-profiles', title: '用户画像', icon: 'Avatar', path: '/marketing/user-profiles' },
        { key: 'segments', title: '用户分群', icon: 'UserFilled', path: '/marketing/segments' },
      ] },
      { key: 'campaign-delivery', title: '活动触达', icon: 'Promotion', children: [
        { key: 'promotion-campaigns', title: '营销活动', icon: 'Promotion', path: '/marketing/campaigns' },
        { key: 'email-templates', title: '邮件模板', icon: 'MessageBox', path: '/marketing/email-templates' },
        { key: 'push-records', title: '推送记录', icon: 'Bell', path: '/marketing/push-records' },
        { key: 'email-records', title: '邮件发送历史', icon: 'Message', path: '/email-records' },
      ] },
      { key: 'promotion-analytics', title: '推广分析', icon: 'DataAnalysis', children: [
        { key: 'ga-short-links', title: '短链配置', icon: 'Link', path: '/ga/short-links' },
        { key: 'ga-click-events', title: '点击事件', icon: 'Aim', path: '/ga/click-events' },
        { key: 'ga-promoter-coupons', title: '口令管理', icon: 'Discount', path: '/ga/promoter-coupons' },
      ] },
      { key: 'marketing-assets', title: '营销素材', icon: 'Picture', children: [
        { key: 'watchface-assets', title: '表盘营销资产', icon: 'Picture', path: '/marketing/watchface-assets' },
      ] },
    ],
  },
  {
    key: 'platform-operations',
    title: '平台运维',
    icon: 'Tools',
    basePaths: ['/ops'],
    children: [
      { key: 'platform-versions', title: '平台版本', icon: 'Connection', path: '/ops/platform-versions' },
      { key: 'system-config', title: '系统配置', icon: 'Setting', path: '/ops/system-config' },
      { key: 'db-backups', title: '数据库备份', icon: 'Files', path: '/ops/db-backups' },
      { key: 's3-ops', title: 'S3 运维', icon: 'Cpu', path: '/ops/s3-ops' },
    ],
  },
]
