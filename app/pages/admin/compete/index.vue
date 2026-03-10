<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { data: games, refresh } = await useAsyncData('admin-games', () =>
  useCompeteApi().listGames({ page: 1, perPage: 50 })
)

async function deleteGame(id: number) {
  await useCompeteApi().deleteGame(id)
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
        { title: '游戏名称', key: 'name' },
        { title: '描述', key: 'description', ellipsis: true },
        { title: '玩家数', key: 'gamerQuantity', width: 80 },
        { title: '状态', key: 'disabled', width: 80, render: (row) => h(NTag, { type: row.disabled ? 'error' : 'success', size: 'small' }, () => row.disabled ? '已禁用' : '启用') },
        {
          title: '操作', key: 'actions', width: 160,
          render: (row) => h(NSpace, {}, () => [
            h(NButton, { size: 'small', onClick: () => navigateTo(`/admin/compete/game/${row.id}`) }, () => '编辑'),
            h(NButton, { size: 'small', type: 'error', onClick: () => deleteGame(row.id) }, () => '删除'),
          ])
        }
      ]"
      :bordered="false"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>
