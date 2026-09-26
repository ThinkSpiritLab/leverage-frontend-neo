import { expect, test, type Page } from '@playwright/test'

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
const runtimeErrors = new WeakMap<Page, string[]>()
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    console.error('Failed page:', page.url(), (await page.locator('body').innerText()).slice(0, 5000))
    await page.screenshot({ path: info.outputPath('failure.png'), fullPage: true })
  }
  expect(runtimeErrors.get(page) ?? []).toEqual([])
})

async function fixture(page: Page, admin = false, privateBot = false) {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message) })
  page.on('requestfailed', request => console.error('Request failed:', request.url(), request.failure()?.errorText))
  const game = { id: 1, title: 'Fixture game', name: 'Fixture game', description: 'Synthetic browser test', gamerQuantity: 2, timeLimit: 1000, memoryLimit: 256, allowHuman: true, disabled: false }
  const mine = { id: 11, gameId: 1, userId: privateBot ? 200 : 100, opensource: !privateBot, title: 'My Bot', name: 'My Bot', type: 'code', code: privateBot ? undefined : 'print(1)', language: 'python', elo: 1200, disabled: false, game }
  const opponent = { ...mine, id: 12, userId: 200, title: 'Opponent', name: 'Opponent' }
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []
  let polls = 0
  await page.addInitScript(() => { if (window === window.top) localStorage.setItem('refreshToken', 'synthetic-browser-test') })
  // Match the API prefix only; Vite also serves /_nuxt/composables/api/*.ts.
  await page.route(url => url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/api/, '')
    let body: unknown = {}
    if (path === '/auth/refresh') body = { accessToken: 'synthetic-access' }
    else if (path === '/auth/profile') body = { id: 100, username: 'Fixture user', role: admin ? 'admin' : 'user' }
    else if (request.method() === 'POST') {
      requests.push({ path, body: request.postDataJSON() })
      if (path.endsWith('/playground')) body = { matchId: 30, testGamerId: 31 }
      else if (path === '/compete/gamers') body = { ...mine, id: 21 }
      else body = game
    }
    else if (path === '/compete/games') body = { items: [game], total: 1 }
    else if (path === '/compete/games/1') body = game
    else if (path === '/compete/gamers') {
      const items = url.searchParams.has('userId') ? [mine] : [mine, opponent]
      body = { items, total: items.length }
    }
    else if (path === '/compete/gamers/11') body = mine
    else if (path === '/compete/matches/30') {
      if (++polls === 1) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
      body = { id: 30, gameId: 1, status: 2, result: { finalResult: { 31: 1, 12: 0 }, rounds: [] }, links: [] }
    }
    else if (path === '/compete/matches') body = { items: [], total: 0 }
    else if (path.endsWith('/leaderboard') || path.endsWith('/elo-history') || path === '/notifications') body = []
    else if (path.endsWith('/stats')) body = { totalMatches: 0, wins: 0, losses: 0, draws: 0 }
    else if (path === '/messages/count') body = { count: 0 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  return requests
}

test('draft survives reload and reaches a contextual test without copy/paste', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const requests = await fixture(page)
  await page.goto('/compete/gamer/11')
  const editor = page.locator('.cm-content[contenteditable="true"]')
  await expect(editor).toContainText('print(1)')
  await editor.fill('print(42)')
  await expect(page.getByRole('status').filter({ hasText: '本地草稿已保存' })).toBeVisible()
  await page.reload()
  await expect(editor).toContainText('print(42)')
  await page.getByRole('button', { name: '测试当前草稿' }).click()
  await expect(page).toHaveURL(/playground\?.*gamerId=11/)
  await expect(page.locator('.cm-content').first()).toContainText('print(42)')
  await page.getByRole('button', { name: /运行测试对局/ }).click()
  await expect(page.getByText('已完成', { exact: true })).toBeVisible({ timeout: 15000 })
  const request = requests.find(item => item.path === '/compete/games/1/playground')
  expect(request?.body).toMatchObject({ code: 'print(42)', language: 'python', opponentGamerId: 12 })
  await expect(page.getByRole('button', { name: /发布为 Bot/ })).toBeVisible()
  await page.locator('.cm-content[contenteditable="true"]').first().fill('print(43)')
  await expect(page.getByRole('button', { name: /发布为 Bot/ })).toBeHidden()
  expect(errors).toEqual([])
})

test('game authoring sends a string runtime, not an OJ numeric language ID', async ({ page }) => {
  const requests = await fixture(page, true)
  await page.goto('/admin/compete/game/new')
  await page.getByPlaceholder('输入游戏名称').fill('New fixture game')
  await page.getByText('裁判程序', { exact: false }).first().click()
  const section = page.locator('.n-collapse-item').filter({ hasText: '裁判程序' })
  await section.locator('.cm-content').click()
  await section.locator('.cm-content').pressSequentially('print(1)')
  await section.locator('.n-base-selection').click()
  await page.getByText('JavaScript', { exact: true }).last().click()
  await expect(section.locator('.cm-content')).toContainText('print(1)')
  await page.getByRole('button', { name: '创建', exact: true }).click()
  await expect.poll(() => requests.some(item => item.path === '/compete/games')).toBe(true)
  expect(requests.find(item => item.path === '/compete/games')?.body).toMatchObject({ judgerLanguage: 'javascript', judgerCode: 'print(1)' })
})

test('mobile editor keeps the code and primary action inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture(page)
  await page.goto('/compete/gamer/11')
  await expect(page.locator('.cm-content')).toContainText('print(1)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391)
  const bounds = await page.locator('.code-editor').boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.width).toBeGreaterThan(250)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391)
  await expect(page.getByRole('button', { name: '测试当前草稿' })).toBeVisible()
})


test('private Bot view does not offer author-only mutations', async ({ page }) => {
  await fixture(page, false, true)
  await page.goto('/compete/gamer/11')
  await expect(page.getByText('这是其他用户的 Bot。公开代码可查看，但只有作者可以修改。')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存新版本' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '删除 Bot' })).toHaveCount(0)
  await expect(page.locator('.cm-content[contenteditable="true"]')).toHaveCount(0)
})

test('renderer scratch survives reload without enabling unauthorized publication', async ({ page }) => {
  await fixture(page)
  await page.goto('/compete/playground?tab=renderer')
  const editor = page.locator('.cm-content[contenteditable="true"]')
  await editor.click()
  await editor.pressSequentially('<p>private renderer draft</p>')
  await expect(page.getByRole('status').filter({ hasText: '本地草稿已保存' })).toBeVisible()
  await page.reload()
  await expect(editor).toContainText('private renderer draft')
  await expect(page.getByRole('button', { name: '🚀 发布', exact: true })).toBeDisabled()
  await expect(page.locator('iframe[sandbox="allow-scripts"]')).toHaveCount(1)
})
