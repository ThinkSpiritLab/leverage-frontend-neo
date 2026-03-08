<template>
  <div class="courses-page">
    <div class="page-header">
      <NH2>课程列表</NH2>
    </div>

    <NGrid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
      <NGridItem v-if="loading" span="3">
        <div class="loading-center">
          <NSpin size="large" />
        </div>
      </NGridItem>
      <NGridItem v-else-if="courses.length === 0" span="3">
        <NEmpty description="暂无课程" />
      </NGridItem>
      <NGridItem
        v-for="course in courses"
        v-else
        :key="course.id"
        span="1"
      >
        <NCard
          hoverable
          class="course-card"
          @click="navigateTo(`/courses/${course.id}`)"
        >
          <template #header>
            <NButton text type="primary" style="font-size: 16px; font-weight: 600">
              {{ course.title || course.name || '未命名课程' }}
            </NButton>
          </template>
          <div class="course-desc">
            <NText depth="3" style="font-size: 14px">
              {{ course.description || '暂无描述' }}
            </NText>
          </div>
          <div class="course-meta">
            <NTag size="small" type="info" :bordered="false">
              题目 {{ course.problems?.length || 0 }} 道
            </NTag>
            <NText depth="3" style="font-size: 12px">
              {{ dayjs(course.createdAt).format('YYYY-MM-DD') }}
            </NText>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <div v-if="total > pageSize" class="pagination">
      <NPagination
        v-model:page="page"
        :page-count="Math.ceil(total / pageSize)"
        :page-size="pageSize"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { Course } from '~/composables/api/courses'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const coursesApi = useCoursesApi()

const page = ref(1)
const pageSize = ref(20)
const courses = ref<Course[]>([])
const total = ref(0)
const loading = ref(false)

async function fetchCourses() {
  loading.value = true
  try {
    const res = await coursesApi.list({ page: page.value, perPage: pageSize.value })
    const data = res.data
    courses.value = data.items ?? data
    total.value = data.total ?? courses.value.length
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchCourses)

function onPageChange(p: number) {
  page.value = p
  fetchCourses()
}

useHead({ title: '课程列表 — Leverage OJ' })
</script>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header :deep(.n-h2) {
  margin: 0;
}

.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.course-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
  height: 100%;
}

.course-desc {
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
