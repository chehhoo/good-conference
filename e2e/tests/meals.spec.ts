import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'

test.describe('Meals page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.goto('/meals')
  })

  test('shows family meal pickup header', async ({ page }) => {
    await expect(page.getByText('家庭餐食')).toBeVisible()
    await expect(page.getByText('Family Meal Pickup')).toBeVisible()
  })

  test('shows all days with meal slots', async ({ page }) => {
    await expect(page.getByText('第 1 天 · Day 1')).toBeVisible()
    await expect(page.getByText('第 2 天 · Day 2')).toBeVisible()
    // All three slots present
    await expect(page.getByText('早餐').first()).toBeVisible()
    await expect(page.getByText('午餐').first()).toBeVisible()
    await expect(page.getByText('晚餐').first()).toBeVisible()
  })

  test('un-picked meals show "尚未取餐"', async ({ page }) => {
    await expect(page.getByText('尚未取餐 Not picked up').first()).toBeVisible()
  })

  test('day 2 dinner slot not rendered (family has no day-2 dinner)', async ({ page }) => {
    // TEST_FAMILY: day 2 dinner = false for both members → slot is hidden
    // The slot component returns null when entitled.length === 0
    const day2Card = page.locator('div', { hasText: '第 2 天 · Day 2' }).last()
    await expect(day2Card.getByText('🌙')).toBeHidden()
  })
})
