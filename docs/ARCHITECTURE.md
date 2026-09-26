# Frontend Architecture

## 项目概览

LevOJ 前端基于 **Nuxt 3 (compatibilityVersion: 4)**（SPA 模式）构建，使用 **Naive UI** 作为组件库。

- **框架：** Nuxt 3 (compatibilityVersion: 4) (`ssr: false`)，启用 `compatibilityVersion: 4`
- **UI 库：** Naive UI（通过插件按需注册）
- **状态管理：** Pinia
- **HTTP 客户端：** Axios（封装于 `useApi()` composable）
- **路由：** Nuxt 文件系统路由（`app/pages/`）
- **开发代理：** Vite dev server 将 `/api/*` 代理到 `http://localhost:3000`，与生产 Nginx 行为保持一致
- **生产部署：** 构建为静态 SPA，由 Nginx 反向代理到后端

---

## 目录结构

```
leverage-frontend-neo/
├── app/                      # Nuxt 3 (compatibilityVersion: 4) 应用根目录
│   ├── app.vue               # 根组件，挂载 NaiveUI provider
│   ├── error.vue             # 全局错误页
│   ├── assets/               # 静态资源（CSS、图片等）
│   ├── components/           # 共享组件
│   │   ├── AppHeader.vue     # 顶部导航栏
│   │   ├── CodeEditor.vue    # CodeMirror 6 代码编辑器
│   │   ├── MarkdownView.vue  # Markdown + KaTeX 渲染器
│   │   ├── PaginatedTable.vue # 带分页的通用表格
│   │   ├── StatusTag.vue     # 提交状态标签（AC/WA/TLE…）
│   │   └── UserLink.vue      # 用户链接（带头像）
│   ├── composables/          # 组合式函数（API 封装层）
│   │   ├── useApi.ts         # Axios 实例工厂 + 拦截器
│   │   └── api/              # 各模块 API 封装
│   │       ├── auth.ts       # 认证相关 API
│   │       ├── compete.ts    # 对战模块 API
│   │       ├── contests.ts   # 竞赛模块 API
│   │       ├── courses.ts    # 课程模块 API
│   │       ├── notifications.ts # 通知模块 API
│   │       ├── problems.ts   # 题目模块 API
│   │       ├── settings.ts   # 系统设置 API
│   │       ├── statistics.ts # 统计模块 API
│   │       ├── submissions.ts # 提交模块 API
│   │       ├── suspicions.ts # 查重模块 API
│   │       ├── tags.ts       # 标签模块 API
│   │       └── users.ts      # 用户模块 API
│   ├── layouts/              # 布局
│   │   ├── default.vue       # 默认布局（带顶部导航）
│   │   ├── admin.vue         # 管理后台布局（带侧边栏）
│   │   └── auth.vue          # 认证页布局（无导航）
│   ├── middleware/           # 路由中间件
│   │   ├── auth.ts           # 登录检查
│   │   ├── admin.ts          # admin 角色检查
│   │   └── supervisor.ts     # supervisor 角色检查
│   ├── pages/                # 文件系统路由页面
│   │   ├── index.vue         # / → 重定向到 /problems
│   │   ├── home.vue          # 主页
│   │   ├── login.vue         # 登录页
│   │   ├── ranklist.vue      # 排行榜
│   │   ├── notification.vue  # 通知列表
│   │   ├── problems/
│   │   │   ├── index.vue     # 题目列表
│   │   │   └── [id].vue      # 题目详情 + 在线提交
│   │   ├── submissions/
│   │   │   ├── index.vue     # 提交列表
│   │   │   └── [id].vue      # 提交详情（评测结果）
│   │   ├── contests/
│   │   │   ├── index.vue     # 竞赛列表
│   │   │   ├── [id].vue      # 竞赛详情（排名、题目）
│   │   │   └── [id]/problems/[pid].vue  # 竞赛内做题页
│   │   ├── courses/
│   │   │   ├── index.vue     # 课程列表
│   │   │   └── [id].vue      # 课程详情
│   │   ├── course/[id]/problems/[pid].vue  # 课程内做题页
│   │   ├── compete/
│   │   │   ├── index.vue     # 对战游戏列表
│   │   │   ├── [id].vue      # 游戏详情（排行榜、Bot列表）
│   │   │   └── matches/[id].vue  # 对局详情
│   │   ├── users/
│   │   │   ├── index.vue     # 用户列表
│   │   │   └── [id].vue      # 用户主页
│   │   ├── user/edit.vue     # 编辑个人信息
│   │   ├── contest-login/[id].vue  # 竞赛登录页
│   │   └── admin/            # 管理后台（admin layout）
│   │       ├── index.vue     # 管理首页（系统概览）
│   │       ├── setting.vue   # 系统配置
│   │       ├── problems/     # 题目管理
│   │       ├── contests/     # 竞赛管理
│   │       ├── courses/      # 课程管理
│   │       ├── submissions/  # 提交管理（含查重）
│   │       ├── users/        # 用户管理
│   │       ├── tags/         # 标签管理
│   │       ├── notifications/# 通知管理
│   │       └── rejudge/      # 批量重判
│   ├── plugins/              # Nuxt 插件
│   │   ├── auth-init.ts      # SPA 启动时从 localStorage 恢复登录态
│   │   ├── naive-ui.ts       # Naive UI 全局注册
│   │   └── naive-ui-components.ts  # Naive UI 按需组件注册
│   ├── stores/               # Pinia Store
│   │   ├── auth.ts           # 认证 Store（token、用户信息）
│   │   └── ui.ts             # UI Store（主题、侧边栏状态）
│   ├── types/
│   │   └── index.ts          # 全局 TypeScript 类型定义
│   └── utils/
│       └── naive.ts          # Naive UI 工具函数（主题、message）
├── nuxt.config.ts            # Nuxt 配置（SPA、Vite proxy、runtimeConfig）
└── docs/                     # 文档目录
    └── ARCHITECTURE.md       # 本文档
```

---

## 状态管理

### Auth Store (`stores/auth.ts`)

使用 Pinia 管理认证状态：

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `accessToken` | `string \| null` | JWT 访问令牌（内存中） |
| `refreshToken` | `string \| null` | 刷新令牌（同时持久化到 `localStorage`） |
| `user` | `User \| null` | 当前用户信息（从 `/auth/profile` 获取） |

**Getters：**

| Getter | 说明 |
|--------|------|
| `isLoggedIn` | `!!accessToken` |
| `isAdmin` | `role` 为 `sa` 或 `admin` |
| `isSupervisor` | `role` 为 `sa`、`admin` 或 `supervisor` |

**Actions：**

| Action | 说明 |
|--------|------|
| `login(username, password)` | 调用后端登录，存储 token，拉取 profile |
| `refreshAccessToken()` | 用 `refreshToken` 换新 `accessToken` |
| `fetchProfile()` | 拉取并更新 `user` 字段 |
| `logout()` | 清空内存状态 + `localStorage` |
| `init()` | SPA 启动时从 `localStorage` 恢复登录态（自动调用 `refreshAccessToken` + `fetchProfile`） |

`init()` 在 `plugins/auth-init.ts` 中于应用启动时自动调用。

---

## API 层

```
useApi()
  └── axios instance (baseURL = NUXT_PUBLIC_API_BASE || '/api')
        ├── 请求拦截器：自动附加 Authorization: Bearer <accessToken>
        └── 响应拦截器：
              - 401 且未重试 → 调用 authStore.refreshAccessToken()
              - 刷新成功 → 重试原请求
              - 刷新失败 → authStore.logout() + navigateTo('/login')
```

**`composables/api/` 各模块封装：**

每个文件导出一个 `use*Api()` 函数，内部调用 `useApi()` 获取 axios 实例，对外暴露语义化方法：

| 文件 | 封装的后端模块 |
|------|--------------|
| `auth.ts` | `/auth` — login、refresh、getProfile |
| `problems.ts` | `/problems` — 列表、详情、创建、标签等 |
| `submissions.ts` | `/submissions` — 列表、详情、提交、重判等 |
| `contests.ts` | `/contests` — 竞赛 CRUD、排名、注册等 |
| `courses.ts` | `/courses` — 课程 CRUD、学生、排行等 |
| `users.ts` | `/users` — 用户 CRUD、改密等 |
| `compete.ts` | `/compete` — 游戏、Bot、对局、房间等 |
| `tags.ts` | `/tags` — 标签树、创建、删除 |
| `notifications.ts` | `/notifications` — 通知列表、已读 |
| `settings.ts` | `/settings` — 公开配置、管理配置 |
| `statistics.ts` | `/statistics` — 系统概览、题目通过率 |
| `suspicions.ts` | `/submissions/sus*` — 查重相关接口 |

---

## 路由守卫

路由中间件位于 `app/middleware/`，在每次导航前执行。

### `auth.ts`（全局守卫）

```
访问 /login + 已登录  → 跳转 /problems
访问其他页面 + 未登录 → 跳转 /login
```

### `admin.ts`

```
!authStore.isAdmin → 跳转 /
```

用于 `admin/` 下所有管理页面。

### `supervisor.ts`

```
!authStore.isSupervisor → 跳转 /
```

用于需要 supervisor+ 权限的页面（如查重管理）。

---

## 代码编辑器

`components/CodeEditor.vue` 基于 **CodeMirror 6** 实现，支持以下语言：

| 语言标识 | 语法高亮 |
|----------|----------|
| `cpp`、`c` | C/C++ (`@codemirror/lang-cpp`) |
| `java` | Java (`@codemirror/lang-java`) |
| `python`、`python2`、`python3` | Python (`@codemirror/lang-python`) |
| `javascript`、`typescript` | JavaScript (`@codemirror/lang-javascript`) |

- 主题：**One Dark** (`@codemirror/theme-one-dark`)
- 支持 `v-model` 双向绑定
- 支持 `readonly` 模式（用于提交详情页展示代码）

---

## 题目渲染

`components/MarkdownView.vue` 使用 **markdown-it** + **KaTeX** 渲染题目描述：

- **markdown-it**：渲染 Markdown，支持 HTML、自动链接、排版优化
- **markdown-it-texmath** + **KaTeX**：渲染数学公式
  - 行内公式：`$...$`
  - 块级公式：`$$...$$`
- KaTeX CSS 已在 `nuxt.config.ts` 中全局引入：`katex/dist/katex.min.css`

---

## 部署

详见 [README.md](../README.md)。

**简要说明：**

1. 构建 SPA：`pnpm build`（输出到 `.output/public/`）
2. Nginx 配置：
   - 静态文件由 Nginx 直接服务
   - `/api/` 请求反向代理到后端（NestJS）
   - 所有未匹配路径返回 `index.html`（SPA 路由）

**环境变量：**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NUXT_PUBLIC_API_BASE` | `/api` | 后端 API 前缀，生产环境由 Nginx 反代 |
