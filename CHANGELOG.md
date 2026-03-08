# CHANGELOG

## [2.0.0] - 2026-03-08

### 🏗️ 架构重构
- 从 Nuxt 2 + Bootstrap Vue 迁移到 Nuxt 4 + Naive UI
- SPA 模式（ssr: false）
- TypeScript strict mode
- Pinia 替换 Vuex
- CodeMirror 6 替换 CodeMirror 5

### ✨ 新页面/功能
- 站内信系统（messages/index.vue + messages/[id].vue）
- AppHeader 未读消息角标（60s 轮询）
- Admin 用户详情（admin/user/[id].vue，4个Tab）
- Admin 游戏详情（admin/compete/game/[id].vue）
- Compete Room（compete/room/[id].vue，5s 轮询）
- Compete Gamer 编辑器（compete/gamer/[id].vue，CodeMirror 6）
- Admin Exam 整合（admin/contests 的 type 过滤器）
- Admin Log/Task/Rejudge Log 运维页面
- 编译错误详情（submissions/ce/[id].vue）
- 帮助页/下载中心
- 404 Error 页（error.vue）
- 用户协议（user-agreement.vue）
- 短链重定向（u/[username].vue）

### 🐛 Bug 修复
- axios res.data.items 取值错误（6个列表页面，users/problems/contests/courses/submissions 全部修复）
- Playwright 发现的 4 个 Bug（NuxtLayout、imports.dirs、Naive UI 注册、axios 取值）

### 🧪 测试
- Playwright E2E: 0 → 30 tests
- 覆盖页面: auth、problems、navigation、messages、ranklist、admin

### 📦 工程
- GitHub Actions CI（typecheck + build + Playwright）
- PR 模板

---

## 📊 Stats

| 仓库 | Commits |
|------|---------|
| leverage-backend-neo | 161 |
| leverage-frontend-neo | 99 |
| **合计** | **260** |
