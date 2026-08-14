import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const routes=[['command centre','/'],['active patients','/patients'],['patient workspace','/patients/PT-20284'],['live observations','/live-observations'],['alerts','/alerts'],['missing readings','/missing-readings'],['care plans','/care-plans'],['medications','/medications'],['tasks','/tasks'],['nurse reviews','/nurse-reviews'],['doctor escalations','/doctor-escalations'],['consultations','/consultations'],['communications','/communications'],['AI insights','/ai-insights'],['risk overview','/risk-overview'],['population trends','/population-trends'],['devices','/devices'],['integrations','/integrations'],['audit','/audit'],['settings','/settings'],['notifications','/notifications'],['patient portal','/patient-demo']] as const
for(const [name,path] of routes)test(`${name} has no WCAG A/AA accessibility violations`,async({page})=>{await page.goto(path);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([])})
test('interactive modal and clinical drawers remain accessible',async({page})=>{await page.goto('/patients');await page.getByRole('button',{name:'Enrol patient'}).click();let results=await new AxeBuilder({page}).include('.modal').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations).toEqual([]);await page.keyboard.press('Escape');await page.goto('/alerts');await page.getByRole('row').nth(1).click();results=await new AxeBuilder({page}).include('.drawer').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations.map(v=>v.id)).toEqual([])})


test('custom dropdowns support keyboard selection without native selects', async ({ page }) => {
  await page.goto('/patients')
  const pathway = page.getByLabel('Care pathway', { exact: true })
  await pathway.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('listbox', { name: 'Care pathway' })).toBeVisible()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(pathway).toContainText('Hypertension')
  await expect(page.locator('select')).toHaveCount(0)
})
