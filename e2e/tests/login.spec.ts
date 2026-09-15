import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login page', () => {
  test('shows branding and email input', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('大會入口')).toBeVisible()
    await expect(page.getByText('Conference Portal')).toBeVisible()
    await expect(page.locator('input[inputmode="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /發送驗證碼/ })).toBeVisible()
  })

  test('OTP flow — send code then verify → dashboard', async ({ page }) => {
    await mockAll(page)
    await page.goto('/login')

    await page.locator('input[inputmode="email"]').fill('wei@example.com')
    await page.getByRole('button', { name: /發送驗證碼/ }).click()

    await expect(page.getByText(/驗證碼已發送至/)).toBeVisible()
    await page.locator('input[inputmode="numeric"]').fill('123456')
    await page.getByRole('button', { name: '驗證 Verify' }).click()

    await page.waitForURL('/', { timeout: 10_000 })
    // Badge card confirms we're on the dashboard
    await expect(page.getByText('ATTENDEE · 大會學員')).toBeVisible()
  })

  test('registration code flow → dashboard', async ({ page }) => {
    await mockAll(page)
    await page.goto('/login')

    await page.getByRole('button', { name: /用報名號碼登入/ }).click()
    await page.locator('input[inputmode="numeric"]').fill('10042')
    await page.locator('input[placeholder*="Chen"]').fill('Chen')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL('/', { timeout: 10_000 })
    await expect(page.getByText('ATTENDEE · 大會學員')).toBeVisible()
  })

  test('resend code button is visible after first send', async ({ page }) => {
    await mockAll(page)
    await page.goto('/login')

    await page.locator('input[inputmode="email"]').fill('wei@example.com')
    await page.getByRole('button', { name: /發送驗證碼/ }).click()

    await expect(page.getByRole('button', { name: /重新發送/ })).toBeVisible()
  })

  test('unauthenticated access to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/login', { timeout: 5_000 })
  })
})
