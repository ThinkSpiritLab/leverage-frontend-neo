import { test, expect } from '@playwright/test'
import { mockAuthApi, mockRanklistApi, loginViaUI } from './mocks/api'

test.describe('排行榜', () => {
  test('应显示排行榜表格', async ({ page }) => {
    await mockAuthApi(page)
    await mockRanklistApi(page)

    await page.goto('/ranklist')
    await page.waitForLoadState('networkidle')

    // 页面标题可见
    await expect(page.getByText('全站排行榜')).toBeVisible()

    // 表格列标题可见
    await expect(page.getByText('排名')).toBeVisible()
    await expect(page.getByText('用户名')).toBeVisible()
    await expect(page.getByText('AC 数')).toBeVisible()
    await expect(page.getByText('提交数')).toBeVisible()
  })

  test('应显示用户名和分数', async ({ page }) => {
    await mockAuthApi(page)
    await mockRanklistApi(page)

    await page.goto('/ranklist')
    await page.waitForLoadState('networkidle')

    // 应渲染 mock 用户
    await expect(page.getByRole('button', { name: 'alice' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'bob' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'charlie' })).toBeVisible()

    // 应显示 AC 数
    await expect(page.getByText('120')).toBeVisible()
    await expect(page.getByText('90')).toBeVisible()
  })

  test('点击用户名应跳转到用户主页', async ({ page }) => {
    await mockAuthApi(page)
    await mockRanklistApi(page)

    // mock /api/users/:id for the user profile page
    await page.route(/\/api\/users\/10$/, async (route) => {
      await route.fulfill({
        json: {
          id: 10,
          username: 'alice',
          role: 'user',
          email: 'alice@example.com',
          accepts: 120,
          submits: 200,
          createdAt: '2026-01-01T00:00:00Z',
        },
      })
    })

    // 需要登录，否则跳转 /users/:id 会被 auth middleware 拦截
    await loginViaUI(page)

    // 重新注入 ranklist mock（loginViaUI 跳转到 /problems，需要在这之前或之后都有路由注册）
    // 已在上方提前注册，route 拦截是 persistent 的，无需重复

    await page.goto('/ranklist')
    await page.waitForLoadState('networkidle')

    // 点击用户名链接
    await page.getByRole('button', { name: 'alice' }).click()

    await expect(page).toHaveURL(/\/users\/10/, { timeout: 10_000 })
  })
})
