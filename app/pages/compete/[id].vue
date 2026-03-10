<script setup lang="ts">
// 旧路由重定向到统一游戏页面
const route = useRoute()
navigateTo(`/compete/games/${route.params.id}`, { replace: true })
</script>
