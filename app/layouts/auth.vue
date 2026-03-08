<template>
  <NMessageProvider>
    <div class="auth-layout">
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-logo">LevOJ</h1>
          <p class="auth-subtitle">在线评测系统</p>
        </div>
        <NCard class="auth-card">
          <slot />
        </NCard>
      </div>
    </div>
  </NMessageProvider>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 16px;
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo {
  font-size: 36px;
  color: #18a058;
  margin: 0;
}

.auth-subtitle {
  color: #666;
  margin: 4px 0 0;
}

.auth-card {
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}
</style>
