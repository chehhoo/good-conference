import type { Page } from '@playwright/test'
import { TEST_TOKEN, TEST_PERSON, TEST_FAMILY, TEST_SESSIONS, TEST_SCAN_RECORDS, TEST_SPEAKER, TEST_SPEAKER_NO_BIO } from './test-data'

/**
 * Mocks all API routes so no real good-api is needed.
 * Must be called before page.goto().
 */
export async function mockAll(page: Page) {
  // Auth
  await page.route('**/api/conference/otp/send', (r) =>
    r.fulfill({ json: { channel: 'EMAIL', maskedDestination: 'w***@example.com' } })
  )
  await page.route('**/api/conference/otp/verify', (r) =>
    r.fulfill({ json: { token: TEST_TOKEN, person: TEST_PERSON } })
  )
  await page.route('**/api/conference/login', (r) =>
    r.fulfill({ json: { token: TEST_TOKEN, person: TEST_PERSON } })
  )

  // Schedule
  await page.route('**/api/schedule', (r) =>
    r.fulfill({ json: TEST_SESSIONS })
  )
  await page.route('**/api/schedule/my-signups', (r) =>
    r.fulfill({ json: TEST_SESSIONS.filter(s => s.signedUp) })
  )
  await page.route('**/api/schedule/*/signup', (r) => {
    if (r.request().method() === 'POST') {
      const id = Number(r.request().url().match(/schedule\/(\d+)/)?.[1])
      const session = TEST_SESSIONS.find(s => s.id === id)
      r.fulfill({ json: { ...session, signedUp: true, signupCount: (session?.signupCount ?? 0) + 1 } })
    } else {
      const id = Number(r.request().url().match(/schedule\/(\d+)/)?.[1])
      const session = TEST_SESSIONS.find(s => s.id === id)
      r.fulfill({ json: { ...session, signedUp: false, signupCount: Math.max(0, (session?.signupCount ?? 0) - 1) } })
    }
  })

  // Speakers
  await page.route('**/api/conference/speakers/7', (r) =>
    r.fulfill({ json: TEST_SPEAKER })
  )
  await page.route('**/api/conference/speakers/8', (r) =>
    r.fulfill({ json: TEST_SPEAKER_NO_BIO })
  )
  await page.route('**/api/conference/speakers/404', (r) =>
    r.fulfill({ status: 404, json: { message: 'Not found' } })
  )
  await page.route('**/api/conference/speakers', (r) =>
    r.fulfill({ json: [TEST_SPEAKER, TEST_SPEAKER_NO_BIO] })
  )

  // Me (called on app load; 401 would clear auth)
  await page.route('**/api/conference/me', (r) =>
    r.fulfill({ json: TEST_PERSON })
  )

  // Announcements (must be mocked or the 401 from real API clears auth in local runs)
  await page.route('**/api/conference/announcements', (r) =>
    r.fulfill({ json: [] })
  )

  // My data
  await page.route('**/api/conference/my/family', (r) =>
    r.fulfill({ json: TEST_FAMILY })
  )
  await page.route('**/api/conference/my/meal-scans', (r) =>
    r.fulfill({ json: TEST_SCAN_RECORDS })
  )
  await page.route('**/api/conference/my/sms-consent', (r) => {
    if (r.request().method() === 'GET') {
      r.fulfill({ json: { smsConsent: false, smsConsentAt: null, mobilePhoneMasked: null } })
    } else {
      r.fulfill({ json: { smsConsent: true, smsConsentAt: new Date().toISOString(), mobilePhoneMasked: null } })
    }
  })
}

/**
 * Seeds localStorage with a valid auth state so tests don't need to go
 * through the login flow. Call after mockAll() and before page.goto().
 */
export async function seedAuth(page: Page) {
  await page.addInitScript(({ token, person }) => {
    localStorage.setItem('gc_token', token)
    localStorage.setItem('gc_person', JSON.stringify(person))
  }, { token: TEST_TOKEN, person: TEST_PERSON })
}
