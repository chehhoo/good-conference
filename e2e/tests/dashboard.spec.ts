import { test, expect } from '@playwright/test'
import { mockAll, seedAuth } from '../fixtures/mock-api'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
  })

  test('shows attendee badge card with name', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('陳偉')).toBeVisible()
    await expect(page.getByText('ATTENDEE · 大會學員')).toBeVisible()
  })

  test('shows "Show Full Badge" button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /顯示大碼/ })).toBeVisible()
  })

  test('full-screen badge overlay opens and closes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /顯示大碼/ }).click()
    // Overlay is white with QR code and name
    await expect(page.locator('.fixed.inset-0').filter({ hasText: '陳偉' })).toBeVisible()
    // Close by clicking the X button
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.fixed.inset-0').filter({ hasText: '陳偉' })).toBeHidden()
  })

  test('shows meal status section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('今日餐食').or(page.getByText('餐食'))).toBeVisible()
    // Meal slot emojis
    await expect(page.getByText('🌅')).toBeVisible()
    await expect(page.getByText('☀️')).toBeVisible()
    await expect(page.getByText('🌙')).toBeVisible()
  })

  test('shows today sessions section with "全部 →" link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: '全部 →' })).toBeVisible()
  })

  test('"全部 →" navigates to schedule page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '全部 →' }).click()
    await page.waitForURL('/schedule')
  })
})
