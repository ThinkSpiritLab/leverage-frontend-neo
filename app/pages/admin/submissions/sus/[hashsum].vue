<template>
  <div class="sus-detail">
    <div class="page-header">
      <NSpace align="center">
        <NButton text @click="navigateTo('/admin/submissions/sus')">
          ← 返回列表
        </NButton>
        <NH2 style="margin: 0">
          抄袭详情 — {{ hashsum.slice(0, 8) }}
        </NH2>
      </NSpace>
      <NButton type="warning" :loading="checkingAll" @click="markAllChecked">
        全部标记为已审查
      </NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="!loading && submissions.length === 0">
        <NEmpty description="暂无相关提交" />
      </div>

      <div v-for="sub in submissions" :key="sub.id" class="sub-card">
        <NCard :title="`提交 #${sub.id} — 用户: ${sub.user?.username ?? sub.userId}`" size="small">
          <template #header-extra>
            <NSpace align="center">
              <StatusTag :status="sub.status" />
              <NSwitch
                :value="!!sub.checked"
                :loading="sub._loading"
                @update:value="(v: boolean) => toggleChecked(sub, v)"
              >
                <template #checked>已审查</template>
                <template #unchecked>未审查</template>
              </NSwitch>
            </NSpace>
          </template>
          <CodeEditor
            :model-value="sub.code ?? '// 暂无代码'"
            :language="sub.language ?? 'cpp'"
            :readonly="true"
            height="300px"
          />
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const message = useMessage()
const suspicionsApi = useSuspicionsApi()

const hashsum = computed(() => route.params.hashsum as string)
const submissions = ref<any[]>([])
const loading = ref(false)
const checkingAll = ref(false)

async function fetchDetail() {
  loading.value = true
  try {
    const res = await suspicionsApi.get(hashsum.value)
    submissions.value = (Array.isArray(res.data) ? res.data : res.data.items ?? []).map((s: any) => ({
      ...s,
      _loading: false,
    }))
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

async function toggleChecked(sub: any, value: boolean) {
  sub._loading = true
  try {
    await suspicionsApi.markChecked(sub.id, value)
    sub.checked = value
    message.success('已更新')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    sub._loading = false
  }
}

async function markAllChecked() {
  checkingAll.value = true
  try {
    for (const sub of submissions.value) {
      if (!sub.checked) {
        await suspicionsApi.markChecked(sub.id, true)
        sub.checked = true
      }
    }
    message.success('全部标记完成')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    checkingAll.value = false
  }
}

onMounted(fetchDetail)

useHead({ title: '可疑代码' })
</script>

<style scoped>
.sus-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sub-card {
  margin-bottom: 16px;
}
</style>
