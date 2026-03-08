# Leverage OJ — Frontend

Leverage OJ 的前端，基于 **Nuxt 4 + Naive UI** 构建的 SPA（单页应用）。

## 技术栈

| 技术 | 用途 |
|------|------|
| Nuxt 4 (SPA 模式) | 应用框架 |
| Vue 3 | UI 框架 |
| Naive UI | 组件库 |
| Pinia | 状态管理 |
| axios | HTTP 请求 |
| CodeMirror 6 | 代码编辑器 |
| markdown-it + KaTeX | 题面渲染（Markdown + 数学公式） |

## 快速开始

### 前置条件

- Node.js 22+
- pnpm
- 后端 [leverage-backend-neo](../leverage-backend-neo) 运行在 `localhost:3000`

### 开发模式

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env

# 启动开发服务器（默认 http://localhost:3001）
pnpm dev
```

开发时，Vite 会将 `/api/*` 代理到 `http://localhost:3000`，与生产 Nginx 行为一致，无需改代码。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NUXT_PUBLIC_API_BASE` | 后端 API 基础路径 | `/api` |

- **开发**：可保持默认 `/api`（Vite 代理会处理），或设为 `http://localhost:3000`
- **生产**：使用 `/api`，由 Nginx 反向代理到后端

## 构建

```bash
pnpm build
```

产物在 `.output/public/`，可直接静态托管（Nginx、CDN 等）。

## 项目结构

```
app/
├── pages/          # 路由页面（文件即路由）
├── components/     # 可复用 Vue 组件
├── composables/    # 组合式函数（useApi、useAuth 等）
├── stores/         # Pinia 状态仓库（auth、user 等）
└── layouts/        # 页面布局模板（default、auth 等）
```

## 与后端配合

后端仓库：[leverage-backend-neo](../leverage-backend-neo)

### 本地开发（两个终端）

```bash
# 终端 1：启动后端
cd leverage-backend-neo
cp .env.example .env
pnpm dev

# 终端 2：启动前端
cd leverage-frontend-neo
pnpm dev
```

访问 `http://localhost:3001`

### 生产部署（Docker Compose）

在后端仓库根目录运行：

```bash
cd leverage-backend-neo
cp .env.example .env
docker-compose -f docker-compose.full.yml up -d
```

访问 `http://localhost`（80 端口）

Nginx 自动处理：
- `/` → 前端静态文件
- `/api/*` → 后端 API（`app:3000`）
