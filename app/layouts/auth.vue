<template>
  <NMessageProvider>
    <div class="auth-layout">
      <div class="auth-visual">
        <div class="visual-inner">
          <h1>Leverage OJ</h1>
          <p>Code. Compete. Conquer.</p>
          <div class="visual-badge">⚡ Online Judge Platform</div>
        </div>
      </div>

      <div class="auth-panel">
        <div class="auth-container">
          <div class="auth-header">
            <h2 class="auth-title">欢迎回来</h2>
            <p class="auth-subtitle">登录后继续你的刷题旅程</p>
          </div>
          <NCard class="auth-card" :bordered="false">
            <slot />
          </NCard>
        </div>
      </div>
    </div>
  </NMessageProvider>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 60% 40%;
  background: #f5f7fa;
}

.auth-visual {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.auth-visual::before,
.auth-visual::after {
  content: '';
  position: absolute;
  border-radius: 999px;
}

.auth-visual::before {
  width: 320px;
  height: 320px;
  background: rgba(255, 255, 255, 0.12);
  top: -120px;
  left: -80px;
}

.auth-visual::after {
  width: 280px;
  height: 280px;
  background: rgba(255, 255, 255, 0.1);
  right: -80px;
  bottom: -120px;
}

.visual-inner {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.visual-inner h1 {
  margin: 0;
  font-size: 52px;
  line-height: 1.05;
}

.visual-inner p {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.86);
}

.visual-badge {
  margin-top: 28px;
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.auth-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-container {
  width: min(420px, 100%);
}

.auth-header {
  margin-bottom: 18px;
}

.auth-title {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.auth-subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.auth-card {
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
}

@media (max-width: 960px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    min-height: 200px;
    justify-content: flex-start;
  }

  .visual-inner h1 {
    font-size: 36px;
  }
}
</style>
