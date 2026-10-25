import { test, expect } from '@playwright/test'
import { mockAll, seedAuth } from '../fixtures/mock-api'
import { TEST_PERSON_GRACE } from '../fixtures/test-data'

test.describe('Language toggle', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    // Clear any persisted lang override so auto-detect runs cleanly
    await page.addInitScript(() => localStorage.removeItem('gc_lang'))
  })

  test('non-Grace attendee sees Chinese nav labels by default', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: '今日' })).toBeVisible()
    await expect(page.getByRole('link', { name: '行程' })).toBeVisible()
    await expect(page.getByRole('link', { name: '餐食' })).toBeVisible()
    await expect(page.getByRole('link', { name: '地圖' })).toBeVisible()
  })

  test('Grace Conference attendee (programCode=2) sees English nav labels by default', async ({ page }) => {
    // Override /me to return the Grace person so React picks up programCode='2'
    await page.route('**/api/conference/me', (r) => r.fulfill({ json: TEST_PERSON_GRACE }))
    await seedAuth(page, TEST_PERSON_GRACE)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Meals' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Map' })).toBeVisible()
  })

  test('clicking EN toggle switches nav to English', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Meals' })).toBeVisible()
  })

  test('clicking ZH after EN toggle restores Chinese nav', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
    await page.getByRole('button', { name: 'ZH', exact: true }).click()
    await expect(page.getByRole('link', { name: '今日' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Today' })).toBeHidden()
  })

  test('EN mode shows English session titles as primary on schedule', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/schedule')
    // Select the All tab to ensure sessions are visible regardless of program filter
    await page.getByRole('button', { name: /全部 All/ }).first().click()
    await expect(page.getByText('開幕式')).toBeVisible({ timeout: 10_000 })
    // Switch to EN
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    // English title now primary; Chinese still present as secondary
    await expect(page.getByText('Opening Ceremony').first()).toBeVisible()
    await expect(page.getByText('開幕式').first()).toBeVisible()
  })
})

test.describe('Language toggle — persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.addInitScript(() => localStorage.removeItem('gc_lang'))
  })

  test('lang toggle writes gc_lang to localStorage and persists across client-side navigation', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()

    // Verify persistence in localStorage
    const stored = await page.evaluate(() => localStorage.getItem('gc_lang'))
    expect(stored).toBe('en')

    // Verify it survives client-side navigation (no page reload, so addInitScript doesn't re-run)
    await page.getByRole('link', { name: 'QR' }).click()
    await page.waitForURL('/my-qr')
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
  })
})
