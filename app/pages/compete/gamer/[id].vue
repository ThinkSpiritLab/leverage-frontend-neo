<template>
  <div class="gamer-page">
    <NSpin :show="loading">
      <NGrid v-if="game" :cols="12" :x-gap="16" :y-gap="16">
        <!-- 左侧：游戏信息 + Gamer 列表 -->
        <NGridItem :span="3">
          <NSpace vertical :size="12">
            <!-- 游戏信息 -->
            <NCard title="游戏信息" size="small">
              <NDescriptions :column="1" size="small">
                <NDescriptionsItem label="游戏">
                  <NButton text type="primary" @click="navigateTo(`/compete/${game.id}`)">
                    {{ game.name }}
                  </NButton>
                </NDescriptionsItem>
                <NDescriptionsItem v-if="game.description" label="描述">
                  {{ game.description }}
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <!-- 我的 Bot 列表 -->
            <NCard title="我的 Bot" size="small">
              <template #header-extra>
                <NButton
                  size="tiny"
                  type="primary"
                  @click="navigateTo(`/compete/gamer/0?gameId=${game.id}`)"
                >
                  + 新建
                </NButton>
              </template>
              <div v-if="myGamers.length === 0" class="empty-tip">
                <NText depth="3">暂无 Bot</NText>
              </div>
              <NList v-else :show-divider="false" size="small">
                <NListItem
                  v-for="g in myGamers"
                  :key="g.id"
                  :class="{ 'gamer-item-active': g.id === currentGamerId }"
                  style="cursor: pointer"
                  @click="navigateTo(`/compete/gamer/${g.id}`)"
                >
                  <div class="gamer-list-item">
                    <span class="gamer-name">{{ g.name }}</span>
                    <NTag size="small" :bordered="false">{{ g.language || '-' }}</NTag>
                  </div>
                </NListItem>
              </NList>
            </NCard>
          </NSpace>
        </NGridItem>

        <!-- 右侧：代码编辑器 -->
        <NGridItem :span="9">
          <NCard
            :title="isNew ? '创建新 Bot' : `编辑 Bot：${gamerForm.name}`"
            size="small"
          >
            <NForm
              ref="formRef"
              :model="gamerForm"
              :rules="formRules"
              label-placement="left"
              label-width="80"
            >
              <NFormItem label="Bot 名称" path="name">
                <NInput
                  v-model:value="gamerForm.name"
                  placeholder="输入 Bot 名称"
                  style="max-width: 320px"
                />
              </NFormItem>
              <NFormItem label="编程语言" path="language">
                <NSelect
                  v-model:value="gamerForm.language"
                  :options="languageOptions"
                  style="max-width: 200px"
                  @update:value="onLanguageChange"
                />
              </NFormItem>
              <NFormItem label="Bot 代码" path="code">
                <div style="width: 100%">
                  <NText depth="3" style="font-size: 12px; margin-bottom: 4px; display: block">
                    "开源"选项仅作保留，实际并无作用
                  </NText>
                  <CodeEditor
                    v-model="gamerForm.code"
                    :language="editorLanguage"
                    height="500px"
                  />
                </div>
              </NFormItem>
            </NForm>

            <template #footer>
              <NSpace justify="end">
                <NButton @click="navigateTo(`/compete/${game.id}`)">取消</NButton>
                <NButton
                  type="primary"
                  :loading="saving"
                  @click="handleSave"
                >
                  {{ isNew ? '创建 Bot' : '保存修改' }}
                </NButton>
              </NSpace>
            </template>
          </NCard>
        </NGridItem>
      </NGrid>

      <NResult v-else-if="!loading" status="404" title="未找到相关内容">
        <template #footer>
          <NButton @click="navigateTo('/compete')">返回竞赛列表</NButton>
        </template>
      </NResult>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const gamerId = computed(() => Number(route.params.id))
const isNew = computed(() => gamerId.value === 0)

const competeApi = useCompeteApi()
const authStore = useAuthStore()
const message = useMessage()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const game = ref<any>(null)
const myGamers = ref<any[]>([])
const currentGamerId = computed(() => gamerId.value)

const formRef = ref<FormInst | null>(null)
const gamerForm = reactive({
  name: '',
  language: 'cpp17',
  code: '',
})

// ─── Language mapping ─────────────────────────────────────────────────────────
const languageOptions = [
  { label: 'C++17', value: 'cpp17' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'Python 3', value: 'python3' },
  { label: 'Python 2', value: 'python2' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
]

// Map backend language id → CodeEditor language
function mapLanguage(lang: string): string {
  if (!lang) return 'cpp'
  if (lang.startsWith('cpp')) return 'cpp'
  if (lang.startsWith('java')) return 'java'
  if (lang.startsWith('python')) return 'python'
  return lang
}

const editorLanguage = computed(() => mapLanguage(gamerForm.language))

function onLanguageChange(_lang: string) {
  // Trigger CodeEditor to re-initialize language mode; it watches the prop
}

// ─── Form rules ───────────────────────────────────────────────────────────────
const formRules = {
  name: [{ required: true, message: '请输入 Bot 名称', trigger: 'blur' }],
  language: [{ required: true, message: '请选择编程语言', trigger: 'change' }],
  code: [{ required: true, message: '请输入 Bot 代码', trigger: 'blur' }],
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    if (isNew.value) {
      // 创建模式：需要 gameId query 参数
      const gameId = Number(route.query.gameId)
      if (!gameId) {
        message.error('缺少 gameId 参数')
        navigateTo('/compete')
        return
      }
      // 从 games 列表中查找游戏信息
      const res = await competeApi.listGames({ page: 1, perPage: 100 })
      game.value = res.data.items.find((g: any) => g.id === gameId) || null
      gamerForm.language = 'cpp17'
      if (game.value) await fetchMyGamers(gameId)
    }
    else {
      // 编辑模式：获取 gamer 详情
      const res = await competeApi.getGamer(gamerId.value)
      const gamer = res.data
      game.value = gamer.game || null
      gamerForm.name = gamer.name || ''
      gamerForm.language = gamer.language || 'cpp17'
      gamerForm.code = gamer.code || ''
      if (game.value) await fetchMyGamers(game.value.id)
    }
  }
  catch (e) {
    console.error(e)
    message.error('加载失败')
  }
  finally {
    loading.value = false
  }
})

async function fetchMyGamers(gameId: number) {
  try {
    const res = await competeApi.listGamers({ gameId, page: 1, perPage: 100 })
    const all: any[] = res.data.items || []
    myGamers.value = all.filter((g: any) => g.userId === authStore.user?.id)
  }
  catch (e) {
    console.error(e)
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  saving.value = true
  try {
    if (isNew.value) {
      const gameId = Number(route.query.gameId)
      const res = await competeApi.createGamer({
        gameId,
        name: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
      })
      message.success('Bot 创建成功！')
      // 跳转到新 gamer 的编辑页
      navigateTo(`/compete/gamer/${res.data.id}`)
    }
    else {
      await competeApi.updateGamer(gamerId.value, {
        name: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
      })
      message.success('Bot 已保存！')
      if (game.value) await fetchMyGamers(game.value.id)
    }
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Bot 详情 — Leverage OJ' })
</script>

<style scoped>
.gamer-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-tip {
  padding: 8px 0;
  text-align: center;
}

.gamer-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 0;
}

.gamer-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.gamer-item-active {
  background: var(--n-color-hover);
  border-radius: 4px;
}
</style>
