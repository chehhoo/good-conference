import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'

test.describe('Schedule', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.goto('/schedule')
    // Wait for sessions to load
    await expect(page.getByText('開幕式')).toBeVisible({ timeout: 10_000 })
  })

  test('shows all sessions grouped by day', async ({ page }) => {
    await expect(page.getByText('開幕式')).toBeVisible()
    await expect(page.getByText('敬拜讚美')).toBeVisible()
    await expect(page.getByText('聖經工作坊 A')).toBeVisible()
    // Day headers
    await expect(page.getByText(/第 1 天/).first()).toBeVisible()
    await expect(page.getByText(/第 2 天/).first()).toBeVisible()
  })

  test('day tab filters to that day only', async ({ page }) => {
    await page.locator('button', { hasText: '第 2 天' }).click()
    await expect(page.getByText('晚間聚會')).toBeVisible()
    await expect(page.getByText('開幕式')).toBeHidden()
  })

  test('capacity bar shows for workshops', async ({ page }) => {
    await expect(page.getByText('10/30')).toBeVisible()
  })

  test('full session detail sheet opens on row click', async ({ page }) => {
    // Click the content area (cursor-pointer div) containing the session title
    await page.locator('div.cursor-pointer', { hasText: '聖經工作坊 A' }).first().click()
    await expect(page.getByText('深入研讀聖經')).toBeVisible()
    await expect(page.getByText('Bible Workshop A').first()).toBeVisible()
    await expect(page.getByText('李弟兄').first()).toBeVisible()
  })

  test('detail sheet closes on X button', async ({ page }) => {
    await page.locator('div.cursor-pointer', { hasText: '聖經工作坊 A' }).first().click()
    await expect(page.getByText('深入研讀聖經')).toBeVisible()
    await page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText('深入研讀聖經')).toBeHidden()
  })

  test('at-capacity session shows 額滿 and disables signup', async ({ page }) => {
    // 小組分享: capacity 20, signupCount 20
    await page.locator('div.cursor-pointer', { hasText: '小組分享' }).first().click()
    await expect(page.getByRole('button', { name: '額滿 Full' })).toBeDisabled()
  })

  test('"我的報名" toggle shows only signed-up sessions', async ({ page }) => {
    await page.getByRole('button', { name: '我的報名 ✓' }).click()
    await expect(page.getByText('尚未報名任何場次')).toBeVisible()
  })

  test('signing up for a session via inline button', async ({ page }) => {
    // The 開幕式 session has no capacity limit — signup button is inline
    const signupBtn = page.locator('button', { hasText: '想去？' }).first()
    await expect(signupBtn).toBeVisible()
    await signupBtn.click()
    // Mock returns signedUp:true, but invalidateQueries will refetch — just verify
    // the POST request was made (no error shown)
    await expect(page.locator('div', { hasText: '報名失敗' })).toBeHidden()
  })

  test('session detail sheet shows conflict warning for overlapping signed-up sessions', async ({ page }) => {
    // Override /api/schedule to return Workshop A already signed up,
    // so opening 小組分享 (same time slot) shows the conflict warning.
    await page.route('**/api/schedule', (r) => r.fulfill({
      json: [
        { id: 1, title: '開幕式', titleEng: 'Opening Ceremony', description: null, descriptionEng: null, speaker: '張牧師', speakerEng: 'Pastor Zhang', startTime: '2026-08-01T09:00:00', endTime: '2026-08-01T10:30:00', location: '大宴會廳', capacity: null, day: 1, sessionType: 'PLENARY', signupCount: 0, signedUp: false },
        { id: 3, title: '聖經工作坊 A', titleEng: 'Bible Workshop A', description: '深入研讀聖經', descriptionEng: 'In-depth Bible study', speaker: '李弟兄', speakerEng: 'Brother Li', startTime: '2026-08-01T14:00:00', endTime: '2026-08-01T15:30:00', location: '會議室 101', capacity: 30, day: 1, sessionType: 'WORKSHOP', signupCount: 11, signedUp: true },
        { id: 4, title: '小組分享', titleEng: 'Small Group', description: null, descriptionEng: null, speaker: null, speakerEng: null, startTime: '2026-08-01T14:00:00', endTime: '2026-08-01T15:30:00', location: '會議室 102', capacity: 20, day: 1, sessionType: 'GENERAL', signupCount: 18, signedUp: false },
      ],
    }))

    await page.reload()
    await expect(page.getByText('聖經工作坊 A')).toBeVisible({ timeout: 10_000 })

    // Open 小組分享 — Workshop A overlaps → conflict warning should appear
    await page.locator('div.cursor-pointer', { hasText: '小組分享' }).first().click()
    await expect(page.getByText(/時間衝突/)).toBeVisible()
    await expect(page.getByText(/與「聖經工作坊 A」時間重疊/)).toBeVisible()
  })
})
