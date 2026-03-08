import { test, expect } from '@playwright/test'

test.describe('路由守卫', () => {
  test('根路径未登录应重定向到 login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login|\/home/, { timeout: 10_000 })
  })

  test('admin 路径未登录应重定向', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('problems 路径未登录应重定向到 login', async ({ page }) => {
    await page.goto('/problems')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
