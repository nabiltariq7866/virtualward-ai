import { expect, test, type Page } from '@playwright/test'

async function fresh(page: Page, path = '/') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  if (path !== '/') await page.goto(path)
}

async function role(page: Page, name: string) {
  await page.getByRole('button', { name: /Rebecca Morgan/ }).click()
  await page.getByRole('button', { name, exact: true }).click()
}

async function customSelect(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: value, exact: true }).click()
}

test('COPD deterioration completes connected clinician workflow', async ({ page }) => {
  await fresh(page, '/live-observations')
  await customSelect(page, 'Live demo scenario', 'COPD Deterioration')
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next step' }).click()

  await page.goto('/patients/PT-20284')
  await expect(page.getByText('High Risk').first()).toBeVisible()
  await page.getByRole('button', { name: /View supporting evidence/ }).click()
  await expect(page.getByRole('dialog', { name: 'Supporting evidence' })).toContainText('92%')
  await page.keyboard.press('Escape')

  await page.goto('/alerts')
  await page.getByText('Declining oxygen saturation trend detected').first().click()
  await page.getByRole('button', { name: 'Acknowledge' }).click()
  await page.getByRole('button', { name: 'Contact patient' }).click()
  await page.getByLabel('Clinical / escalation notes').fill('SpO2 trend and increased breathlessness reviewed with patient.')
  await page.getByRole('button', { name: /Create nurse review/ }).click()
  await page.getByRole('button', { name: /Escalate/ }).click()

  await page.goto('/doctor-escalations')
  await role(page, 'Consultant Physician')
  await page.locator('.doctor-row').first().click()
  await page.getByRole('button', { name: /Adjust monitoring plan/ }).click()

  await page.goto('/patients/PT-20284')
  await expect(page.getByText('Needs Review').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Timeline' }).click()
  await expect(page.getByText('Monitoring plan updated')).toBeVisible()
})

test('device failure and coordinator reconnect restore data continuity', async ({ page }) => {
  await fresh(page, '/live-observations')
  await customSelect(page, 'Live demo scenario', 'Device Disconnection')
  await page.getByRole('button', { name: 'Next step' }).click()

  await page.goto('/devices')
  await expect(page.getByText('Offline').first()).toBeVisible()
  await role(page, 'Remote Care Coordinator')
  await page.getByText('OX-40812', { exact: true }).click()
  const deviceDialog = page.getByRole('dialog')
  await deviceDialog.getByRole('button', { name: /Retry demo sync/ }).click()
  await expect(deviceDialog.getByText('Connected', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto('/patients/PT-20284')
  await expect(page.getByText('96%').first()).toBeVisible()

  await page.goto('/alerts')
  await customSelect(page, 'Alert status', 'Resolved')
  await expect(page.getByRole('row').filter({ hasText: 'Device Offline' }).first()).toContainText('Resolved')
  await expect(page.getByRole('row').filter({ hasText: 'Missing Reading' }).first()).toContainText('Resolved')
})

test('virtual discharge enforces readiness then releases device', async ({ page }) => {
  await fresh(page, '/discharge/PT-20425')
  await role(page, 'Consultant Physician')
  await page.getByRole('button', { name: 'Confirm discharge' }).click()
  await expect(page.getByText(/Resolve critical alerts/)).toBeVisible()

  await page.goto('/live-observations')
  await customSelect(page, 'Live demo scenario', 'Virtual Discharge')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.goto('/discharge/PT-20425')
  await page.getByRole('button', { name: 'Confirm discharge' }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await expect(page.getByText('Emily Watson')).not.toBeVisible()
  await page.goto('/devices')
  await expect(page.getByRole('row').filter({ hasText: 'TH-11102' })).toContainText('Available')
})

test('enrolment updates cohort and duplicate episode is rejected', async ({ page }) => {
  await fresh(page, '/patients')
  await page.getByRole('button', { name: 'Enrol patient' }).click()
  let dialog = page.getByRole('dialog', { name: 'Enrol patient' })
  await dialog.getByLabel('Full name').fill('Claire Robinson')
  await dialog.getByLabel('Patient contact').fill('demo@example.test')
  await dialog.getByLabel('Emergency contact').fill('Alex 07000 000000')
  await dialog.getByLabel('Primary condition').fill('COPD recovery')
  await dialog.getByRole('button', { name: 'Enrol patient' }).click()
  await expect(page.getByRole('heading', { name: 'Claire Robinson' })).toBeVisible()

  await page.goto('/patients')
  await page.getByRole('button', { name: 'Enrol patient' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Full name').fill('Margaret Ellis')
  await dialog.getByLabel('Patient contact').fill('demo@example.test')
  await dialog.getByLabel('Emergency contact').fill('Alex 07000 000000')
  await dialog.getByLabel('Primary condition').fill('COPD')
  await dialog.getByRole('button', { name: 'Enrol patient' }).click()
  await expect(page.getByRole('alert')).toContainText('active Virtual Ward episode')
})

test('patient portal reading reaches clinician state on mobile', async ({ page }) => {
  await fresh(page, '/patient-demo')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: /Hello, Margaret/ })).toBeVisible()
  await page.getByRole('button', { name: 'Enter reading' }).click()
  await customSelect(page, 'Reading type', 'SpO2')
  await page.getByLabel(/Value/).fill('92')
  await page.getByRole('button', { name: 'Submit reading' }).click()
  await expect(page.getByText('92%').first()).toBeVisible()
  await page.goto('/patients/PT-20284')
  await expect(page.getByText('High Risk').first()).toBeVisible()
})

test('AI summary citation opens the exact source record', async ({ page }) => {
  await fresh(page, '/patients/PT-20284')
  const summary = page.locator('.summary-card')
  await expect(summary).toContainText('Remote care summary')
  await summary.locator('.source-row button').first().click()
  const evidence = page.getByRole('dialog', { name: /Evidence/ })
  await expect(evidence).toBeVisible()
  await expect(evidence).toContainText(/Exact frontend state record used by the AI summary|Synthetic source record/)
  await page.keyboard.press('Escape')
})

test('dialogs close with Escape and major routes have no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await fresh(page, '/patients')
  await page.getByRole('button', { name: 'Enrol patient' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  for (const path of ['/', '/alerts', '/care-plans', '/medications', '/tasks', '/ai-insights', '/risk-overview', '/population-trends', '/integrations', '/audit', '/settings', '/notifications', '/communications']) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
  }
  expect(errors).toEqual([])
})
