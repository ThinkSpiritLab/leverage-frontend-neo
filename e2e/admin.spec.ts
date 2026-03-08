import { test, expect } from '@playwright/test'
import { mockAuthApi, mockAdminUserApi, loginViaUI } from './mocks/api'

test.describe('Admin 用户管理', () => {
  test('admin/users 应列出用户', async ({ page }) => {
    await mockAuthApi(page)
    await mockAdminUserApi(page)

    await loginViaUI(page)
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // 页面标题
    await expect(page.getByText('用户管理')).toBeVisible()

    // 列表中出现 mock 用户
    await expect(page.getByText('testuser')).toBeVisible()
    await expect(page.getByText('alice')).toBeVisible()
  })

  test('admin/user/:id 应显示用户详情', async ({ page }) => {
    await mockAuthApi(page)
    await mockAdminUserApi(page)

    await loginViaUI(page)
    await page.goto('/admin/user/1')
    await page.waitForLoadState('networkidle')

    // 页面标题含用户名
    await expect(page.getByText('testuser')).toBeVisible()

    // 统计卡片可见
    await expect(page.getByText('通过数')).toBeVisible()
    await expect(page.getByText('提交数')).toBeVisible()

    // Tabs 可见
    await expect(page.getByRole('tab', { name: '基本信息' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '提交记录' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '权限' })).toBeVisible()
  })

  test('admin/user/:id 基本信息 tab 应可编辑', async ({ page }) => {
    await mockAuthApi(page)
    await mockAdminUserApi(page)

    await loginViaUI(page)
    await page.goto('/admin/user/1')
    await page.waitForLoadState('networkidle')

    // 基本信息 tab 默认选中
    await expect(page.getByRole('tab', { name: '基本信息' })).toBeVisible()

    // 邮箱输入框应有值（来自 mock 数据）
    const emailInput = page.getByPlaceholder('输入邮箱')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveValue('test@example.com')

    // 学号输入框可编辑
    const studentIdInput = page.getByPlaceholder('输入学号')
    await expect(studentIdInput).toBeVisible()
    await studentIdInput.fill('S999')
    await expect(studentIdInput).toHaveValue('S999')

    // 保存信息按钮可见
    await expect(page.getByRole('button', { name: '保存信息' })).toBeVisible()
  })
})
