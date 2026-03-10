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

            <!-- Bot 状态 + ELO排名条 -->
            <NCard v-if="!isNew && currentGamer" title="Bot 状态" size="small">
              <NDescriptions :column="1" size="small" style="margin-bottom:12px">
                <NDescriptionsItem label="Bot 名称">{{ currentGamer.name }}</NDescriptionsItem>
                <NDescriptionsItem label="ELO 积分">
                  <NTag type="info" :bordered="false" size="medium" style="font-size:15px;font-weight:700">
                    ⚡ {{ currentGamer.elo ?? 1200 }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem v-if="eloRankInfo" label="内榜排名">
                  <NText type="success" strong>#{{ eloRankInfo.rank }} / {{ eloRankInfo.total }}</NText>
                </NDescriptionsItem>
              </NDescriptions>

              <!-- ELO 横向分布图 -->
              <div v-if="eloRankInfo && eloRankInfo.total > 1" class="elo-bar-wrapper">
                <div class="elo-bar-label">
                  <span>{{ eloRankInfo.minElo }}</span>
                  <span style="color:#888;font-size:11px">ELO 分布</span>
                  <span>{{ eloRankInfo.maxElo }}</span>
                </div>
                <div class="elo-bar-track">
                  <!-- Other bots -->
                  <div
                    v-for="dot in eloRankInfo.others"
                    :key="dot.id"
                    class="elo-dot other"
                    :style="{ left: dot.pct + '%' }"
                    :title="`${dot.name}: ${dot.elo}`"
                  />
                  <!-- This bot -->
                  <div
                    class="elo-dot self"
                    :style="{ left: eloRankInfo.selfPct + '%' }"
                    :title="`${currentGamer.name}: ${currentGamer.elo ?? 1200}`"
                  />
                </div>
                <div style="text-align:center;font-size:11px;color:#888;margin-top:4px">
                  ● 你的 Bot &nbsp;○ 其他 Bot
                </div>
              </div>
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
              <NSpace justify="space-between">
                <NButton v-if="!isNew" type="error" ghost :loading="deleting" @click="confirmDelete">
                  删除 Bot
                </NButton>
                <div v-else />
                <NSpace>
                  <NButton @click="navigateTo(`/compete/${game.id}`)">取消</NButton>
                  <NButton type="primary" :loading="saving" @click="handleSave">
                    {{ isNew ? '创建 Bot' : '保存修改' }}
                  </NButton>
                </NSpace>
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
import { useMessage, useDialog } from 'naive-ui'
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
const dialog = useDialog()
const deleting = ref(false)

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const game = ref<any>(null)
const myGamers = ref<any[]>([])
const currentGamerId = computed(() => gamerId.value)
const currentGamer = ref<any>(null)

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
      // 获取游戏信息
      const res = await competeApi.getGame(gameId)
      game.value = res.data || null
      gamerForm.language = 'cpp17'
      if (game.value) await fetchMyGamers(gameId)
    }
    else {
      // 编辑模式：获取 gamer 详情
      const res = await competeApi.getGamer(gamerId.value)
      const gamer = res.data
      currentGamer.value = gamer
      game.value = gamer.game || null
      gamerForm.name = gamer.name || ''
      gamerForm.language = gamer.language || 'cpp17'
      gamerForm.code = gamer.code || ''
      if (game.value) {
        await fetchMyGamers(game.value.id)
        fetchEloRank(game.value.id, gamer.elo ?? 1200, gamerId.value)
      }
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

// ─── ELO Rank Bar ─────────────────────────────────────────────────────────────
const eloRankInfo = ref<{
  rank: number; total: number; minElo: number; maxElo: number; selfPct: number
  others: { id: number; name: string; elo: number; pct: number }[]
} | null>(null)

async function fetchEloRank(gameId: number, myElo: number, myGamerId: number) {
  try {
    const res = await competeApi.getLeaderboard(gameId, 'inner')
    const board: any[] = Array.isArray(res.data) ? res.data : []
    if (board.length < 2) return

    const elos = board.map((r: any) => Number(r.elo ?? 1200))
    const minElo = Math.min(...elos)
    const maxElo = Math.max(...elos)
    const range = maxElo - minElo || 1

    const pct = (elo: number) => Math.round(((elo - minElo) / range) * 90)  // 0-90% to leave room

    const sorted = [...board].sort((a: any, b: any) => b.elo - a.elo)
    const rank = sorted.findIndex((r: any) => r.gamerId === myGamerId) + 1

    eloRankInfo.value = {
      rank: rank > 0 ? rank : board.length,
      total: board.length,
      minElo, maxElo,
      selfPct: pct(myElo),
      others: board
        .filter((r: any) => r.gamerId !== myGamerId)
        .map((r: any) => ({ id: r.gamerId, name: r.name || `Bot#${r.gamerId}`, elo: Number(r.elo), pct: pct(Number(r.elo)) })),
    }
  } catch (e) { console.error('fetchEloRank', e) }
}

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
        title: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
        opensource: false,
      })
      message.success('Bot 创建成功！')
      // 跳转到新 gamer 的编辑页
      navigateTo(`/compete/gamer/${res.data.id}`)
    }
    else {
      const res = await competeApi.updateGamer(gamerId.value, {
        title: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
      })
      message.success('Bot 已保存（新版本已创建）！')
      // Fork 返回新 gamer，跳转到新版本页面
      const newId = res.data?.id
      if (newId) {
        navigateTo(`/compete/gamer/${newId}`)
      }
      else if (game.value) {
        await fetchMyGamers(game.value.id)
      }
    }
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

function confirmDelete() {
  dialog.warning({
    title: '删除 Bot',
    content: '确定删除这个 Bot 吗？有对局历史的 Bot 会被禁用（保留历史），无历史的 Bot 将彻底删除。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: handleDelete,
  })
}

async function handleDelete() {
  deleting.value = true
  try {
    const res = await competeApi.deleteGamer(gamerId.value)
    const d = res.data as any
    if (d?.deleted) {
      message.success('Bot 已彻底删除')
    } else {
      message.info('Bot 有对局历史，已禁用（不再参与对局）')
    }
    navigateTo(`/compete/${game.value?.id}`)
  } catch (e: any) {
    message.error(e?.response?.data?.message || '删除失败')
  } finally {
    deleting.value = false
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

/* ELO Distribution Bar */
.elo-bar-wrapper {
  padding: 4px 2px;
}
.elo-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #aaa;
  margin-bottom: 4px;
}
.elo-bar-track {
  position: relative;
  height: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  margin: 0 4px;
}
.elo-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: default;
}
.elo-dot.other {
  background: #d0d0d0;
  border: 1px solid #bbb;
  z-index: 1;
}
.elo-dot.self {
  background: #18a058;
  border: 2px solid #fff;
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 2px #18a058;
  z-index: 2;
}
</style>
