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

  test('"me" hero card is highlighted with accent border', async ({ page }) => {
    const meCard = page.locator('div.rounded-2xl').filter({ hasText: '我' })
    await expect(meCard).toBeVisible()
  })

  test('meal pills show abbreviated slot labels', async ({ page }) => {
    // Meals now render as compact pills: 早 / 午 / 晚
    await expect(page.getByText('早').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('午').first()).toBeVisible()
    await expect(page.getByText('晚').first()).toBeVisible()
  })

  test('registration code is shown in hero card', async ({ page }) => {
    await expect(page.getByText('220')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/英文名字/)).toBeVisible()
  })

  test('quick-action buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /我的證件/ })).toBeVisible({ timeout: 10_000 })
  })

  test('lodging shows room number', async ({ page }) => {
    // Expand family member row to see lodging
    await expect(page.getByText(/301/).first()).toBeVisible({ timeout: 10_000 })
  })
})
