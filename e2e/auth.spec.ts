import { test, expect } from '@playwright/test'
import { mockAuthApi } from './mocks/api'

test.describe('认证', () => {
  test('未登录访问题目列表应重定向到登录页', async ({ page }) => {
    await page.goto('/problems')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('登录页应正确渲染', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    // auth layout 中显示 "Leverage OJ"
    await expect(page.getByText('Leverage OJ')).toBeVisible()
    // NInput 渲染为标准 input
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('登录成功后跳转到题目列表', async ({ page }) => {
    await mockAuthApi(page)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('input').first().fill('testuser')
    await page.locator('input[type="password"]').fill('password')
    await page.click('button:has-text("登录")')

    await expect(page).toHaveURL(/\/problems/, { timeout: 10_000 })
  })

  test('登录失败应显示错误提示', async ({ page }) => {
    await mockAuthApi(page)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('input').first().fill('wrong')
    await page.locator('input[type="password"]').fill('wrong')
    await page.click('button:has-text("登录")')

    // 登录失败显示 NAlert（type=error），默认文案 "账号或密码错误，请重试"
    await expect(page.getByText(/账号或密码错误|账号或密码|错误/)).toBeVisible({ timeout: 5_000 })
  })
})
