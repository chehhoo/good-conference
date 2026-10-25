import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'

test.describe('Speaker bio sheet', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.goto('/schedule')
    await expect(page.getByText('開幕式')).toBeVisible({ timeout: 10_000 })
  })

  test('speaker with speakerId is tappable in session list', async ({ page }) => {
    // 開幕式 has speakerId 7 — speaker name should be a button
    const btn = page.getByRole('button', { name: /張牧師/ })
    await expect(btn).toBeVisible()
  })

  test('speaker without speakerId is plain text, not tappable', async ({ page }) => {
    // 聖經工作坊 A has no speakerId — should be a span, not a button
    const btn = page.getByRole('button', { name: /李弟兄/ })
    await expect(btn).toHaveCount(0)
    await expect(page.getByText('李弟兄').first()).toBeVisible()
  })

  test('tapping linked speaker opens bio sheet with both languages', async ({ page }) => {
    await page.getByRole('button', { name: /張牧師/ }).click()
    await expect(page.getByText('王大明牧師')).toBeVisible()
    await expect(page.getByText('Pastor David Wang')).toBeVisible()
    await expect(page.getByText('神學院院長，事奉主三十年。')).toBeVisible()
    await expect(page.getByText('Seminary president with thirty years of ministry.')).toBeVisible()
  })

  test('bio sheet closes with X button without opening session detail', async ({ page }) => {
    await page.getByRole('button', { name: /張牧師/ }).click()
    await expect(page.getByText('王大明牧師')).toBeVisible()
    await page.getByRole('button', { name: '關閉' }).click()
    await expect(page.getByText('王大明牧師')).toBeHidden()
    // session detail sheet must NOT have opened
    await expect(page.getByText('開幕式 Opening Ceremony').first()).toBeHidden()
  })

  test('bio sheet closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: /張牧師/ }).click()
    await expect(page.getByText('王大明牧師')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('王大明牧師')).toBeHidden()
  })

  test('speaker with no bio shows friendly placeholder', async ({ page }) => {
    // Override session 1 speaker to one with no bio
    await page.route('**/api/conference/speakers/7', (r) =>
      r.fulfill({ json: { id: 7, nameChn: '張牧師', nameEng: null, bioChn: null, bioEng: null, photoUrl: null } })
    )
    await page.reload()
    await expect(page.getByText('開幕式')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /張牧師/ }).click()
    await expect(page.getByText(/簡介即將更新|Bio coming soon/)).toBeVisible()
  })

  test('speaker detail sheet also has tappable speaker', async ({ page }) => {
    await page.locator('div.cursor-pointer', { hasText: '開幕式' }).first().click()
    // Wait for the session detail sheet (h2 title inside the fixed sheet)
    const sheet = page.locator('div.fixed.bottom-0')
    await expect(sheet.locator('h2', { hasText: '開幕式' })).toBeVisible()
    // Speaker name in detail sheet should be an underlined tappable button
    const speakerBtn = sheet.locator('button', { hasText: '張牧師' })
    await expect(speakerBtn).toBeVisible()
    await speakerBtn.click()
    await expect(page.getByText('王大明牧師')).toBeVisible()
  })
})
