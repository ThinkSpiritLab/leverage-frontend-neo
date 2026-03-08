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
  DocumentTextOutline,
  RefreshOutline,
  SettingsOutline,
  NotificationsOutline,
  PricetagsOutline,
  LibraryOutline,
  BriefcaseOutline,
  ListOutline,
  ServerOutline,
} from '@vicons/ionicons5'
useHead({ titleTemplate: (s) => s ? `${s} — Leverage OJ 管理后台` : 'Leverage OJ 管理后台' })

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
  {
    label: '提交管理',
    key: 'admin-submissions',
    icon: renderIcon(DocumentTextOutline),
    children: [
      {
        label: '全部提交',
        key: 'admin-submissions',
        onClick: () => navigateTo('/admin/submissions'),
      },
      {
        label: '抄袭检测',
        key: 'admin-submissions-sus',
        onClick: () => navigateTo('/admin/submissions/sus'),
      },
    ],
  },
  {
    label: '重判',
    key: 'admin-rejudge',
    icon: renderIcon(RefreshOutline),
    children: [
      {
        label: '批量重判',
        key: 'admin-rejudge-index',
        onClick: () => navigateTo('/admin/rejudge'),
      },
      {
        label: '重评测记录',
        key: 'admin-rejudge-log',
        onClick: () => navigateTo('/admin/rejudge/log'),
      },
    ],
  },
  {
    label: '标签管理',
    key: 'admin-tags',
    icon: renderIcon(PricetagsOutline),
    onClick: () => navigateTo('/admin/tags'),
  },
  {
    label: '学院管理',
    key: 'admin-colleges',
    icon: renderIcon(LibraryOutline),
    onClick: () => navigateTo('/admin/colleges'),
  },
  {
    label: '专业管理',
    key: 'admin-professions',
    icon: renderIcon(BriefcaseOutline),
    onClick: () => navigateTo('/admin/professions'),
  },
  {
    label: '通知管理',
    key: 'admin-notifications',
    icon: renderIcon(NotificationsOutline),
    onClick: () => navigateTo('/admin/notifications'),
  },
  {
    label: '系统设置',
    key: 'admin-setting',
    icon: renderIcon(SettingsOutline),
    onClick: () => navigateTo('/admin/setting'),
  },
  {
    label: '系统日志',
    key: 'admin-log',
    icon: renderIcon(ListOutline),
    onClick: () => navigateTo('/admin/log'),
  },
  {
    label: '系统任务',
    key: 'admin-task',
    icon: renderIcon(ServerOutline),
    onClick: () => navigateTo('/admin/task'),
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
