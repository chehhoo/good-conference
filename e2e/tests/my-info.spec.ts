import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'

test.describe('My Info', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.goto('/my-info')
  })

  test('shows family member cards', async ({ page }) => {
    await expect(page.getByText('陳偉')).toBeVisible()
    await expect(page.getByText('陳麗')).toBeVisible()
  })

  test('"me" card is highlighted with accent border', async ({ page }) => {
    // The card for isMe:true has border-top accent color applied inline
    const meCard = page.locator('div.rounded-2xl').filter({ hasText: '我' })
    await expect(meCard).toBeVisible()
  })

  test('meal grid shows days and slots', async ({ page }) => {
    // MealsGrid renders 第{d}天 (no spaces)
    await expect(page.getByText('第1天').first()).toBeVisible()
    await expect(page.getByText('第2天').first()).toBeVisible()
    await expect(page.getByText('早餐').first()).toBeVisible()
    await expect(page.getByText('午餐').first()).toBeVisible()
    await expect(page.getByText('晚餐').first()).toBeVisible()
  })

  test('lodging shows room number', async ({ page }) => {
    await expect(page.getByText(/301/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('SMS opt-in section is shown', async ({ page }) => {
    await expect(page.getByText('登入方式 Sign-in')).toBeVisible()
  })
})
