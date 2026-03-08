<template>
  <div class="admin-rejudge">
    <NH2>批量重判</NH2>

    <NCard title="筛选条件" style="max-width: 980px">
      <NForm :model="filterForm" label-placement="left" label-width="110px">
        <NGrid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <NGi>
            <NFormItem label="用户ID">
              <NInputNumber v-model:value="filterForm.userId" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
            <NFormItem label="题目ID">
              <NInputNumber v-model:value="filterForm.problemId" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
            <NFormItem label="课程ID">
              <NInputNumber v-model:value="filterForm.courseId" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
            <NFormItem label="竞赛ID">
              <NInputNumber v-model:value="filterForm.contestId" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="起始SID">
              <NInputNumber v-model:value="filterForm.idStart" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
            <NFormItem label="终止SID">
              <NInputNumber v-model:value="filterForm.idEnd" :min="1" placeholder="可留空" clearable style="width: 100%" />
            </NFormItem>
            <NFormItem label="起始日期">
              <NDatePicker
                v-model:value="filterForm.dateStart"
                type="datetime"
                clearable
                placeholder="可留空"
                style="width: 100%"
              />
            </NFormItem>
            <NFormItem label="终止日期">
              <NDatePicker
                v-model:value="filterForm.dateEnd"
                type="datetime"
                clearable
                placeholder="可留空"
                style="width: 100%"
              />
            </NFormItem>
            <NFormItem label="状态筛选">
              <NSelect
                v-model:value="filterForm.status"
                :options="statusOptions"
                placeholder="全部状态（留空则全选）"
                clearable
              />
            </NFormItem>
          </NGi>
        </NGrid>

        <NFormItem>
          <NButton type="primary" :loading="counting" @click="handleQueryCount">
            查询数量
          </NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NModal v-model:show="showConfirm" preset="dialog" title="确认批量重判" positive-text="确认重判" negative-text="取消" :positive-button-props="{ type: 'error', loading: rejudging }" @positive-click="handleConfirmRejudge">
      将重判 {{ pendingCount }} 条提交。
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { STATUS_LABEL } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const submissionsApi = useSubmissionsApi()
const message = useMessage()

const filterForm = ref({
  userId: null as number | null,
  problemId: null as number | null,
  idStart: null as number | null,
  idEnd: null as number | null,
  dateStart: null as number | null,
  dateEnd: null as number | null,
  contestId: null as number | null,
  courseId: null as number | null,
  status: null as number | null,
})

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: Number(value),
}))

const counting = ref(false)
const rejudging = ref(false)
const showConfirm = ref(false)
const pendingCount = ref(0)

function buildPayload() {
  const payload: Record<string, number> = {}
  const form = filterForm.value
  if (form.userId !== null) payload.userId = form.userId
  if (form.problemId !== null) payload.problemId = form.problemId
  if (form.idStart !== null) payload.idStart = form.idStart
  if (form.idEnd !== null) payload.idEnd = form.idEnd
  if (form.dateStart !== null) payload.dateStart = form.dateStart
  if (form.dateEnd !== null) payload.dateEnd = form.dateEnd
  if (form.contestId !== null) payload.contestId = form.contestId
  if (form.courseId !== null) payload.courseId = form.courseId
  if (form.status !== null) payload.status = form.status
  return payload
}

async function handleQueryCount() {
  counting.value = true
  try {
    const res = await submissionsApi.batchRejudge(buildPayload(), true)
    const raw = res.data
    pendingCount.value = typeof raw === 'number' ? raw : Number(raw?.count || 0)
    if (pendingCount.value <= 0) {
      message.info('没有匹配的提交，无需重判')
      return
    }
    showConfirm.value = true
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '查询数量失败')
  }
  finally {
    counting.value = false
  }
}

async function handleConfirmRejudge() {
  rejudging.value = true
  try {
    await submissionsApi.batchRejudge(buildPayload())
    showConfirm.value = false
    message.success(`已加入重判队列：${pendingCount.value} 条`)
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '批量重判失败')
  }
  finally {
    rejudging.value = false
  }
}

useHead({ title: '重测' })
</script>

<style scoped>
.admin-rejudge {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
