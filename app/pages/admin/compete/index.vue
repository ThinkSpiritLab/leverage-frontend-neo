<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace } from 'naive-ui'

definePageMeta({ layout: 'admin' })

const { data: games, refresh } = await useAsyncData('admin-games', () =>
  useCompeteApi().listGames({ page: 1, perPage: 50 })
)

async function toggleDisabled(id: number, currentDisabled: boolean) {
  await useCompeteApi().updateGame(id, { disabled: !currentDisabled })
  refresh()
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <NH2>Bot 对战管理</NH2>
      <NButton type="primary" @click="navigateTo('/admin/compete/game/new')">
        创建游戏
      </NButton>
    </div>

    <NDataTable
      :data="games?.data?.items ?? []"
      :columns="[
        { title: 'ID', key: 'id', width: 60 },
        { title: '游戏名称', key: 'name', render: (row) => h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/admin/compete/game/${row.id}`) }, () => row.name || row.title) },
        { title: '描述', key: 'description', ellipsis: true },
        { title: '玩家数', key: 'gamerQuantity', width: 80 },
        { title: '状态', key: 'disabled', width: 80, render: (row) => h(NTag, { type: row.disabled ? 'error' : 'success', size: 'small' }, () => row.disabled ? '已禁用' : '启用') },
        {
          title: '操作', key: 'actions', width: 200,
          render: (row) => h(NSpace, {}, () => [
            h(NButton, { size: 'small', onClick: () => navigateTo(`/admin/compete/game/${row.id}`) }, () => '编辑'),
            h(NButton, {
              size: 'small',
              type: row.disabled ? 'primary' : 'warning',
              onClick: () => toggleDisabled(row.id, row.disabled)
            }, () => row.disabled ? '启用' : '禁用'),
          ])
        }
      ]"
      :bordered="false"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>
