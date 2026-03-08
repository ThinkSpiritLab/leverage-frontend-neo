<template>
  <div class="admin-home">
    <NH2>管理后台</NH2>
    <NText depth="3" style="margin-bottom: 24px; display: block">
      欢迎回来，{{ authStore.user?.username }}！
    </NText>

    <NGrid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
      <NGridItem
        v-for="item in menuItems"
        :key="item.key"
        span="1"
      >
        <NCard
          hoverable
          class="menu-card"
          @click="navigateTo(item.path)"
        >
          <div class="card-content">
            <NIcon :size="36" :color="item.color">
              <component :is="item.icon" />
            </NIcon>
            <div class="card-text">
              <div class="card-title">{{ item.title }}</div>
              <NText depth="3" style="font-size: 13px">{{ item.desc }}</NText>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<script setup lang="ts">
import {
  PeopleOutline,
  CodeSlashOutline,
  TrophyOutline,
  SchoolOutline,
} from '@vicons/ionicons5'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const authStore = useAuthStore()

const menuItems = [
  {
    key: 'users',
    title: '用户管理',
    desc: '管理系统用户，查看角色和权限',
    path: '/admin/users',
    icon: PeopleOutline,
    color: '#2080f0',
  },
  {
    key: 'problems',
    title: '题目管理',
    desc: '创建、编辑题目，上传测试数据',
    path: '/admin/problems',
    icon: CodeSlashOutline,
    color: '#18a058',
  },
  {
    key: 'contests',
    title: '竞赛管理',
    desc: '管理竞赛，配置题目和时间',
    path: '/admin/contests',
    icon: TrophyOutline,
    color: '#f0a020',
  },
  {
    key: 'courses',
    title: '课程管理',
    desc: '管理课程，关联题目和学员',
    path: '/admin/courses',
    icon: SchoolOutline,
    color: '#8a2be2',
  },
]
</script>

<style scoped>
.admin-home {
  display: flex;
  flex-direction: column;
}

.menu-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}
</style>
