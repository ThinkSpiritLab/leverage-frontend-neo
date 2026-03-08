import { type Page } from '@playwright/test'

export const mockUser = {
  id: 1,
  username: 'testuser',
  role: 'sa' as const,
  email: 'test@example.com',
  accepts: 42,
  submits: 100,
  createdAt: '2026-01-01T00:00:00Z',
}

export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}

/**
 * Mock 认证相关 API：login / refresh / profile
 */
export async function mockAuthApi(page: Page) {
  // Mock 登录
  await page.route('**/api/auth/login', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')
    if (body.username === 'testuser' && body.password === 'password') {
      await route.fulfill({ json: mockTokens })
    }
    else {
      await route.fulfill({ status: 401, json: {} })
    }
  })

  // Mock token 刷新（localStorage 有 refreshToken 时 init() 会调用）
  await page.route('**/api/auth/refresh', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')
    if (body.refreshToken === 'mock-refresh-token') {
      await route.fulfill({ json: { accessToken: 'mock-access-token' } })
    }
    else {
      await route.fulfill({ status: 401, json: {} })
    }
  })

  // Mock 获取用户信息
  await page.route('**/api/auth/profile', async (route) => {
    const auth = route.request().headers()['authorization']
    if (auth?.includes('mock-access-token')) {
      await route.fulfill({ json: mockUser })
    }
    else {
      await route.fulfill({ status: 401, json: {} })
    }
  })
}

/**
 * Mock 题目相关 API：list / detail
 */
export async function mockProblemsApi(page: Page) {
  // 先注册具体路径，避免被通配符覆盖
  await page.route('**/api/problems/1', async (route) => {
    await route.fulfill({
      json: {
        id: 1,
        logicId: 1001,
        prefix: 'A',
        title: '两数之和',
        accepts: 50,
        submits: 100,
        tags: [],
        hidden: false,
        timeLimit: 1000,
        memoryLimit: 64,
        description: '# 题目\n\n给定两个整数，求其和。',
      },
    })
  })

  // 题目列表（可能带 ?page=&perPage= 等查询参数）
  await page.route(/\/api\/problems(\?.*)?$/, async (route) => {
    await route.fulfill({
      json: {
        items: [
          {
            id: 1,
            logicId: 1001,
            prefix: 'A',
            title: '两数之和',
            accepts: 50,
            submits: 100,
            tags: [],
            hidden: false,
            timeLimit: 1000,
            memoryLimit: 64,
            description: '# 题目\n\n给定两个整数，求其和。',
          },
          {
            id: 2,
            logicId: 1002,
            prefix: 'A',
            title: '斐波那契数列',
            accepts: 30,
            submits: 80,
            tags: [],
            hidden: false,
            timeLimit: 1000,
            memoryLimit: 64,
            description: '# 题目\n\n求第 n 个斐波那契数。',
          },
        ],
        total: 2,
      },
    })
  })
}

/**
 * 登录辅助：通过 UI 流程完成登录
 */
export async function loginViaUI(page: Page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  // NInput 会渲染为标准 input 元素
  const usernameInput = page.locator('input').first()
  const passwordInput = page.locator('input[type="password"]')
  await usernameInput.fill('testuser')
  await passwordInput.fill('password')
  await page.click('button:has-text("登录")')
  await page.waitForURL(/\/problems/, { timeout: 10_000 })
}

/**
 * 通过 localStorage 模拟已登录状态（需搭配 mockAuthApi 使用）
 * 注意：先 goto 任意页面让 localStorage 可访问，再设置
 */
export async function setLoggedInViaStorage(page: Page) {
  await page.evaluate((tokens) => {
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }, mockTokens)
}
