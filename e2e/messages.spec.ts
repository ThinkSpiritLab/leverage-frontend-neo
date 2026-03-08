import { test, expect } from '@playwright/test'
import { mockAuthApi, mockMessagesApi, loginViaUI } from './mocks/api'

test.describe('收件箱', () => {
  test('未登录访问收件箱应跳转到登录页', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('登录后应显示消息列表', async ({ page }) => {
    await mockAuthApi(page)
    await mockMessagesApi(page)

    await loginViaUI(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // 应显示页面标题
    await expect(page.getByText('收件箱')).toBeVisible()

    // 应渲染两条消息内容预览
    await expect(page.getByText(/欢迎使用 Leverage OJ/)).toBeVisible()
    await expect(page.getByText(/感谢你的反馈/)).toBeVisible()
  })

  test('点击消息应跳转到详情页', async ({ page }) => {
    await mockAuthApi(page)
    await mockMessagesApi(page)

    await loginViaUI(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // 点击第一条消息（unread 状态）
    await page.getByText(/欢迎使用 Leverage OJ/).click()

    await expect(page).toHaveURL(/\/messages\/1/, { timeout: 10_000 })
  })

  test('顶部应显示"联系管理员"按钮', async ({ page }) => {
    await mockAuthApi(page)
    await mockMessagesApi(page)

    await loginViaUI(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: '联系管理员' })).toBeVisible()
  })

  test('联系管理员弹窗应正确显示', async ({ page }) => {
    await mockAuthApi(page)
    await mockMessagesApi(page)

    await loginViaUI(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // 点击"联系管理员"按钮
    await page.getByRole('button', { name: '联系管理员' }).click()

    // 弹窗标题可见
    await expect(page.getByText('联系管理员').first()).toBeVisible()

    // 表单字段可见
    await expect(page.getByPlaceholder('请输入标题')).toBeVisible()
    await expect(page.getByPlaceholder('请输入消息内容')).toBeVisible()

    // 取消按钮可见
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible()

    // 发送按钮可见（默认禁用，因为内容为空）
    await expect(page.getByRole('button', { name: '发送' })).toBeVisible()
  })
})
