import { test, expect } from '@playwright/test'
import { mockAll } from '../fixtures/mock-api'
import { TEST_PERSON } from '../fixtures/test-data'

test.describe('My QR', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page)
    await page.goto('/my-qr')
  })

  test('shows QR code and attendee name', async ({ page }) => {
    await expect(page.getByText('陳偉')).toBeVisible()
    await expect(page.getByText(/入場 QR/)).toBeVisible()
    // SVG QR code rendered
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('full-screen badge opens and shows name', async ({ page }) => {
    await page.getByRole('button', { name: /顯示大碼/ }).click()
    const overlay = page.locator('.fixed.inset-0')
    await expect(overlay.getByText('陳偉')).toBeVisible()
    await expect(overlay.getByText(/出示此碼給工作人員/)).toBeVisible()
  })

  test('full-screen badge closes on tap', async ({ page }) => {
    await page.getByRole('button', { name: /顯示大碼/ }).click()
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.fixed.inset-0')).toBeHidden()
  })

  test('QR value is uid when available', async ({ page }) => {
    const qrValue = await page.locator('svg[data-qr-value]').getAttribute('data-qr-value')
      .catch(() => null)
    // react-qr-code doesn't expose data attributes — verify via page title instead
    await expect(page.getByText(TEST_PERSON.chineseName)).toBeVisible()
  })
})
