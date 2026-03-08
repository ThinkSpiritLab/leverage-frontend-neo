<template>
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <NLayout has-sider style="min-height: 100vh">
          <!-- 管理员侧边栏 -->
          <NLayoutSider
            :collapsed="uiStore.sidebarCollapsed"
            collapse-mode="width"
            :collapsed-width="64"
            :width="240"
            show-trigger
            bordered
            @collapse="uiStore.toggleSidebar"
            @expand="uiStore.toggleSidebar"
          >
            <div class="logo-area">
              <span v-if="!uiStore.sidebarCollapsed" class="logo-text">LevOJ 管理</span>
              <span v-else class="logo-icon">A</span>
            </div>
            <NMenu
              :collapsed="uiStore.sidebarCollapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="adminMenuOptions"
              :value="activeKey"
            />
          </NLayoutSider>

          <NLayout>
            <!-- 顶栏 -->
            <NLayoutHeader bordered style="padding: 0 16px; display: flex; align-items: center; justify-content: space-between; height: 56px">
              <NBreadcrumb>
                <NBreadcrumbItem>
                  <NButton text @click="navigateTo('/')">首页</NButton>
                </NBreadcrumbItem>
                <NBreadcrumbItem>管理后台</NBreadcrumbItem>
              </NBreadcrumb>
              <NDropdown
                v-if="authStore.isLoggedIn"
                :options="userMenuOptions"
                @select="handleUserMenuSelect"
              >
                <NButton text>
                  {{ authStore.user?.username }}
                  <NTag type="warning" size="small" style="margin-left: 8px">
                    {{ authStore.user?.role }}
                  </NTag>
                </NButton>
              </NDropdown>
            </NLayoutHeader>

            <!-- 主内容 -->
            <NLayoutContent style="padding: 24px">
              <slot />
            </NLayoutContent>
          </NLayout>
        </NLayout>
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import { renderIcon } from '~/utils/naive'
import {
  PeopleOutline,
  CodeSlashOutline,
  TrophyOutline,
  SchoolOutline,
  HomeOutline,
  LogOutOutline,
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()

const activeKey = computed(() => route.name as string)

const adminMenuOptions = [
  {
    label: '仪表板',
    key: 'admin',
    icon: renderIcon(HomeOutline),
    onClick: () => navigateTo('/admin'),
  },
  {
    label: '用户管理',
    key: 'admin-users',
    icon: renderIcon(PeopleOutline),
    onClick: () => navigateTo('/admin/users'),
  },
  {
    label: '题目管理',
    key: 'admin-problems',
    icon: renderIcon(CodeSlashOutline),
    onClick: () => navigateTo('/admin/problems'),
  },
  {
    label: '竞赛管理',
    key: 'admin-contests',
    icon: renderIcon(TrophyOutline),
    onClick: () => navigateTo('/admin/contests'),
  },
  {
    label: '课程管理',
    key: 'admin-courses',
    icon: renderIcon(SchoolOutline),
    onClick: () => navigateTo('/admin/courses'),
  },
]

const userMenuOptions = [
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
}
</script>

<style scoped>
.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #efeff5;
}

.logo-text {
  color: #f0a020;
}

.logo-icon {
  color: #f0a020;
}
</style>
