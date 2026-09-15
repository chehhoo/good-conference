import { test as setup } from '@playwright/test'
import { mockAll } from './mock-api'
import { TEST_TOKEN, TEST_PERSON } from './test-data'

const AUTH_FILE = 'e2e/fixtures/.auth.json'

setup('authenticate as attendee', async ({ page }) => {
  await mockAll(page)
  await page.goto('/login')

  // Use OTP flow
  await page.locator('input[inputmode="email"]').fill('wei@example.com')
  await page.getByRole('button', { name: /發送驗證碼/ }).click()

  // Enter 6-digit code
  await page.locator('input[inputmode="numeric"]').fill('123456')
  await page.getByRole('button', { name: /驗證/ }).click()

  // Wait until redirected to dashboard
  await page.waitForURL('/', { timeout: 10_000 })

  // Verify token landed in localStorage
  await page.waitForFunction(
    (token) => localStorage.getItem('gc_token') === token,
    TEST_TOKEN,
    { timeout: 5_000 }
  )

  await page.context().storageState({ path: AUTH_FILE })
})
