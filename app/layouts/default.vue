<template>
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <NLoadingBarProvider>
          <NLayout has-sider class="app-layout">
            <NLayoutSider
              :collapsed="uiStore.sidebarCollapsed"
              collapse-mode="width"
              :collapsed-width="64"
              :width="220"
              show-trigger
              bordered
              @collapse="uiStore.toggleSidebar"
              @expand="uiStore.toggleSidebar"
            >
              <div class="logo-area" :class="{ collapsed: uiStore.sidebarCollapsed }" style="cursor:pointer" @click="navigateTo('/')">
                <div class="logo-main">
                  <span v-if="!uiStore.sidebarCollapsed" class="logo-text">Leverage OJ</span>
                  <span v-else class="logo-icon">OJ</span>
                </div>
                <div v-if="!uiStore.sidebarCollapsed" class="logo-version">v2.0</div>
              </div>
              <NMenu
                :collapsed="uiStore.sidebarCollapsed"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                :options="menuOptions"
                :value="activeKey"
              />
            </NLayoutSider>

            <NLayout class="main-layout">
              <NLayoutHeader bordered class="header-bar">
                <NBreadcrumb>
                  <NBreadcrumbItem>{{ currentRouteLabel }}</NBreadcrumbItem>
                </NBreadcrumb>

                <div class="header-right">
                  <NDropdown
                    v-if="authStore.isLoggedIn"
                    :options="userMenuOptions"
                    @select="handleUserMenuSelect"
                  >
                    <NButton text class="user-trigger">
                      <NBadge :value="unreadCount" :max="99" :show="unreadCount > 0" type="error">
                        <NAvatar round size="small" :style="{ backgroundColor: avatarColor }">
                          {{ authStore.user?.username?.[0]?.toUpperCase() }}
                        </NAvatar>
                      </NBadge>
                      <span class="username">{{ authStore.user?.username }}</span>
                      <NTag
                        size="small"
                        round
                        :bordered="false"
                        :type="roleTagType"
                      >
                        {{ roleLabel }}
                      </NTag>
                    </NButton>
                  </NDropdown>
                  <NButton v-else text @click="navigateTo('/login')">
                    登录
                  </NButton>
                </div>
              </NLayoutHeader>

              <NLayoutContent class="content-shell">
                <div class="content-inner">
                  <slot />
                </div>
              </NLayoutContent>
            </NLayout>
          </NLayout>
        </NLoadingBarProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import type { DropdownOption } from 'naive-ui'
import { renderIcon } from '~/utils/naive'
import {
  PersonOutline,
  CodeSlashOutline,
  TrophyOutline,
  SchoolOutline,
  SettingsOutline,
  LogOutOutline,
  HelpCircleOutline,
  ListOutline,
  PodiumOutline,
  ChatbubbleOutline,
  NotificationsOutline,
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()
const notificationsApi = useNotificationsApi()
const msgApi = useMessageApi()

const unreadNotifCount = ref(0)
const unreadMsgCount = ref(0)
const unreadCount = computed(() => unreadNotifCount.value + unreadMsgCount.value)
let unreadTimer: ReturnType<typeof setInterval> | null = null

const activeKey = computed(() => route.name as string)

const baseMenuOptions = [
  {
    label: '题目列表',
    key: 'problems',
    icon: renderIcon(CodeSlashOutline),
    onClick: () => navigateTo('/problems'),
  },
  {
    label: '竞赛',
    key: 'contests',
    icon: renderIcon(TrophyOutline),
    onClick: () => navigateTo('/contests'),
  },
  {
    label: '课程',
    key: 'courses',
    icon: renderIcon(SchoolOutline),
    onClick: () => navigateTo('/courses'),
  },
  {
    label: '提交记录',
    key: 'submissions',
    icon: renderIcon(ListOutline),
    onClick: () => navigateTo('/submissions'),
  },
  {
    label: '排行榜',
    key: 'ranklist',
    icon: renderIcon(PodiumOutline),
    onClick: () => navigateTo('/ranklist'),
  },
  {
    label: '消息',
    key: 'messages',
    icon: renderIcon(ChatbubbleOutline),
    onClick: () => navigateTo('/messages'),
  },
  {
    label: '通知',
    key: 'notification',
    icon: renderIcon(NotificationsOutline),
    onClick: () => navigateTo('/notification'),
  },
  {
    label: '帮助',
    key: 'help',
    icon: renderIcon(HelpCircleOutline),
    onClick: () => navigateTo('/help'),
  },
]

const adminMenuOptions = [
  {
    label: '管理后台',
    key: 'admin',
    icon: renderIcon(SettingsOutline),
    onClick: () => navigateTo('/admin'),
  },
]

const menuOptions = computed(() => {
  if (authStore.isSupervisor) {
    return [...baseMenuOptions, ...adminMenuOptions]
  }
  return baseMenuOptions
})

const routeLabelMap: Record<string, string> = {
  '/': '首页',
  '/home': '首页',
  '/problems': '题目列表',
  '/contests': '竞赛',
  '/courses': '课程',
  '/submissions': '提交记录',
  '/ranklist': '排行榜',
  '/messages': '消息',
  '/notification': '通知',
  '/help': '帮助',
  '/admin': '管理后台',
}

const currentRouteLabel = computed(() => {
  const exact = routeLabelMap[route.path]
  if (exact) return exact
  const root = `/${route.path.split('/').filter(Boolean)[0] ?? ''}`
  return routeLabelMap[root] ?? '当前页面'
})

const roleLabel = computed(() => authStore.user?.role ?? 'user')

const roleTagType = computed(() => {
  if (authStore.user?.role === 'sa') return 'error'
  if (authStore.user?.role === 'admin') return 'warning'
  return 'info'
})

const avatarColor = computed(() => {
  const seed = authStore.user?.username ?? 'U'
  const palette = ['#2080f0', '#18a058', '#f0a020', '#d03050', '#7a5af8', '#009688']
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palette[hash % palette.length]
})

async function refreshUnreadCount() {
  if (!authStore.isLoggedIn) {
    unreadNotifCount.value = 0
    unreadMsgCount.value = 0
    return
  }
  try {
    const [notifRes, msgRes] = await Promise.all([
      notificationsApi.list({ read: false, perPage: 1 }),
      msgApi.getUnreadCount(),
    ])
    unreadNotifCount.value = Number((notifRes as any).data?.unreadCount ?? (notifRes as any).data?.total ?? 0)
    unreadMsgCount.value = Number((msgRes as any).data?.count ?? 0)
  }
  catch {
    unreadNotifCount.value = 0
    unreadMsgCount.value = 0
  }
}

onMounted(() => {
  refreshUnreadCount()
  unreadTimer = setInterval(refreshUnreadCount, 60 * 1000)
})

onUnmounted(() => {
  if (unreadTimer) clearInterval(unreadTimer)
})

watch(() => authStore.isLoggedIn, refreshUnreadCount)

const userMenuOptions: DropdownOption[] = [
  {
    label: '个人主页',
    key: 'profile',
    icon: renderIcon(PersonOutline),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOutOutline),
  },
]

function handleUserMenuSelect(key: string) {
  if (key === 'logout') {
    authStore.logout()
    navigateTo('/login')
  }
  else if (key === 'profile') {
    navigateTo(`/users/${authStore.user?.id}`)
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  background: #f5f7fa;
}

.main-layout,
.content-shell {
  background: #f5f7fa;
}

.logo-area {
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-bottom: 1px solid #efeff5;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
}

.logo-main {
  font-weight: 700;
  line-height: 1;
}

.logo-text {
  color: #2080f0;
  letter-spacing: 0.3px;
}

.logo-icon {
  color: #2080f0;
  font-size: 14px;
}

.logo-version {
  font-size: 11px;
  color: #9aa4b2;
}

.logo-area.collapsed {
  height: 56px;
}

.header-bar {
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  background: #fff;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  color: #333;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-shell {
  padding: 24px;
  height: calc(100vh - 56px);
  overflow: auto;
}

.content-inner {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
