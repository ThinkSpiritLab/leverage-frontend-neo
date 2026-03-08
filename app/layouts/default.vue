<template>
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <NLoadingBarProvider>
          <NLayout has-sider style="min-height: 100vh">
            <!-- 侧边栏 -->
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
              <div class="logo-area">
                <span v-if="!uiStore.sidebarCollapsed" class="logo-text">LevOJ</span>
                <span v-else class="logo-icon">OJ</span>
              </div>
              <NMenu
                :collapsed="uiStore.sidebarCollapsed"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                :options="menuOptions"
                :value="activeKey"
              />
            </NLayoutSider>

            <NLayout>
              <!-- 顶栏 -->
              <NLayoutHeader bordered style="padding: 0 16px; display: flex; align-items: center; justify-content: space-between; height: 56px">
                <div class="header-left">
                  <span style="font-size: 18px; font-weight: bold">LevOJ</span>
                </div>
                <div class="header-right">
                  <NDropdown
                    v-if="authStore.isLoggedIn"
                    :options="userMenuOptions"
                    @select="handleUserMenuSelect"
                  >
                    <NButton text>
                      <NAvatar round size="small" style="margin-right: 8px">
                        {{ authStore.user?.username?.[0]?.toUpperCase() }}
                      </NAvatar>
                      {{ authStore.user?.username }}
                    </NButton>
                  </NDropdown>
                  <NButton v-else text @click="navigateTo('/login')">
                    登录
                  </NButton>
                </div>
              </NLayoutHeader>

              <!-- 主内容区 -->
              <NLayoutContent style="padding: 24px">
                <slot />
              </NLayoutContent>
            </NLayout>
          </NLayout>
        </NLoadingBarProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import { renderIcon } from '~/utils/naive'
import {
  PersonOutline,
  CodeSlashOutline,
  TrophyOutline,
  SchoolOutline,
  SettingsOutline,
  LogOutOutline,
  HelpCircleOutline,
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()

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

const userMenuOptions = [
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
.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #efeff5;
}

.logo-text {
  color: #18a058;
}

.logo-icon {
  color: #18a058;
  font-size: 14px;
}
</style>
