<script setup lang="ts">
const authStore = useAuthStore()

if (authStore.isLoggedIn) {
  navigateTo('/home', { replace: true })
}
else {
  navigateTo('/login', { replace: true })
}
</script>
