# Leverage OJ — Frontend

Leverage OJ 的前端，基于 **Nuxt 3 (compatibilityVersion: 4) + Naive UI** 构建的 SPA（单页应用）。

## 技术栈

| 技术 | 用途 |
|------|------|
| Nuxt 3 (compatibilityVersion: 4) (SPA 模式) | 应用框架 |
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
pnpm install --frozen-lockfile

# 复制环境变量
cp .env.example .env

# 启动开发服务器（默认 http://localhost:3001）
pnpm dev --port 3001
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

## 主要功能

- **题库**：题目列表、详情、提交与代码编辑（CodeMirror 6）
- **竞赛**：比赛列表、实时排名、气球追踪
- **课程**：课程管理、学生注册、提交导出
- **消息收件箱**：用户间站内消息（收件箱 / 发件箱）
- **通知**：系统通知中心
- **Admin**：用户管理、题目管理、考试（exam）管理（支持按课程筛选过滤）
- **排行榜**：全局 Redis 排行榜
- **错误页**：统一 404 / 500 / 403 错误页（`app/error.vue`）

## Botzone 开发与验证

参见 [游戏、裁判与渲染器开发指南](docs/BOTZONE_DEVELOPMENT.md)。游戏作者使用字符串运行时名称，不使用 OJ 的数字语言枚举。

```bash
pnpm test:regression
pnpm test:botzone
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e:fe -- e2e/bot-authoring.spec.ts
```

`test:botzone` 包含生产构建，需要 Python 3 和本机 Chrome。浏览器场景使用模拟 API/SSE，只验证前端与消息边界；可信示例程序的 stdin/stdout 检查不代表外部 judge 或沙箱验收。草稿按账号和游戏/Bot 隔离，仅保存在当前浏览器，不包含令牌、API Key 或 webhook secret。

## 项目结构

```
app/
├── pages/          # 路由页面（文件即路由）
│   ├── messages/   # 收件箱 / 消息详情
│   ├── admin/      # 管理后台（exam 支持课程过滤）
│   └── ...
├── components/     # 可复用 Vue 组件
├── composables/    # 组合式函数（useApi、useAuth 等）
├── stores/         # Pinia 状态仓库（auth、user 等）
├── error.vue       # 全局错误页（404 / 403 / 500）
└── layouts/        # 页面布局模板（default、auth 等）
```

## 与后端配合

后端仓库：[leverage-backend-neo](../leverage-backend-neo)

### 本地开发（两个终端）

```bash
# 终端 1：启动后端
cd leverage-backend-neo
cp .env.example .env
# 配置数据库、Redis 和 JWT 后启动
pnpm start:dev

# 终端 2：启动前端
cd leverage-frontend-neo
pnpm dev --port 3001
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
